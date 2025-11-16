# plumber.R
# Serve XGBoost model saved in final_model.rds

library(plumber)
library(xgboost)
library(Matrix)
library(jsonlite)

# ------------------------------------------------------------
# 0. Load training schema (for factor levels) and model
# ------------------------------------------------------------

# Base data used only to get consistent factor levels
base_data <- read.csv("cleaned_data.csv", stringsAsFactors = FALSE)

# Apply the SAME preprocessing as in training
base_data$product_code      <- factor(base_data$product_code)
base_data$order_qty         <- log1p(as.numeric(base_data$order_qty))
base_data$sales_unit        <- factor(base_data$sales_unit)
base_data$plant             <- factor(base_data$plant)
base_data$storage_location  <- factor(base_data$storage_location)
base_data$order_dow         <- factor(base_data$order_dow)
base_data$delivery_dow      <- factor(base_data$delivery_dow)
base_data$lead_time         <- log1p(as.numeric(base_data$lead_time))
base_data$month             <- factor(base_data$month)
base_data$coinciding_delivery <- factor(base_data$coinciding_delivery)

formula_x <- ~
  product_code +
  order_qty +
  sales_unit +
  plant +
  storage_location +
  order_dow +
  delivery_dow + 
  lead_time + 
  month + 
  coinciding_delivery

# Load trained model
final_model <- readRDS("final_model.rds")

if (is.null(final_model$feature_names)) {
  stop("final_model$feature_names is NULL. Make sure the model was trained with xgboost and saved via saveRDS().")
}

model_feature_names <- final_model$feature_names

# ------------------------------------------------------------
# 1. Helper: preprocess new data and build design matrix
# ------------------------------------------------------------
required_features <- c(
  "product_code",
  "order_qty",
  "sales_unit",
  "plant",
  "storage_location",
  "order_dow",
  "delivery_dow",
  "lead_time",
  "month",
  "coinciding_delivery"
)

make_design_matrix <- function(new_df) {
  # Basic required column check
  missing <- setdiff(required_features, names(new_df))
  if (length(missing) > 0) {
    stop(paste("Missing required columns in input:", paste(missing, collapse = ", ")))
  }
  
  # --- 1. Numeric transforms (same as training) ---
  new_df$order_qty <- log1p(as.numeric(new_df$order_qty))
  new_df$lead_time <- log1p(as.numeric(new_df$lead_time))
  
  # --- 2. Product code: bucket unseen to "other" ---
  # base_data$product_code already has "other" from your preprocessing
  pc_train_levels <- levels(base_data$product_code)
  if (!("other" %in% pc_train_levels)) {
    stop('"other" level not found in base_data$product_code, but API expects it.')
  }
  
  pc_raw <- as.character(new_df$product_code)
  pc_mapped <- ifelse(pc_raw %in% pc_train_levels, pc_raw, "other")
  new_df$product_code <- factor(pc_mapped, levels = pc_train_levels)
  
  # --- 3. Other factors: allow new levels by extending level set ---
  extend_levels <- function(x_new, x_train_levels) {
    # union so that no NA is created; extra levels will produce extra columns
    all_levels <- union(x_train_levels, unique(as.character(x_new)))
    factor(as.character(x_new), levels = all_levels)
  }
  
  new_df$sales_unit       <- extend_levels(new_df$sales_unit,       levels(base_data$sales_unit))
  new_df$plant            <- extend_levels(new_df$plant,            levels(base_data$plant))
  new_df$storage_location <- extend_levels(new_df$storage_location, levels(base_data$storage_location))
  new_df$order_dow        <- extend_levels(new_df$order_dow,        levels(base_data$order_dow))
  new_df$delivery_dow     <- extend_levels(new_df$delivery_dow,     levels(base_data$delivery_dow))
  new_df$month            <- extend_levels(new_df$month,            levels(base_data$month))
  new_df$coinciding_delivery <- extend_levels(
    new_df$coinciding_delivery,
    levels(base_data$coinciding_delivery)
  )
  
  # --- 4. Template trick to guarantee same structure as training ---
  template <- base_data[1, required_features]
  combined <- rbind(template, new_df)
  
  X_combined <- sparse.model.matrix(formula_x, data = combined)
  
  # Drop template row
  X_new <- X_combined[-1, , drop = FALSE]
  
  # --- 5. Align columns with model features (drop any new columns) ---
  model_feature_names <- final_model$feature_names
  keep <- intersect(colnames(X_new), model_feature_names)
  X_new <- X_new[, keep, drop = FALSE]
  
  # Reorder exactly as model expects
  X_new <- X_new[, model_feature_names, drop = FALSE]
  
  X_new
}


# ------------------------------------------------------------
# 2. Custom Serializer for proper JSON (scalars not arrays)
# ------------------------------------------------------------
unboxedJSON <- function(val, req, res, errorHandler){
  tryCatch({
    json <- jsonlite::toJSON(val, auto_unbox = TRUE, null = "null", na = "null")
    res$setHeader("Content-Type", "application/json")
    res$body <- json
    return(res$toResponse())
  }, error=function(e){
    errorHandler(req, res, e)
  })
}

# ------------------------------------------------------------
# 3. API Endpoints
# ------------------------------------------------------------

#* Simple health check
#* @get /ping
#* @serializer json
function() {
  list(status = "ok", model_loaded = !is.null(final_model))
}

#* Predict failure probability for one or more orders
#* 
#* Expects JSON body with an array of objects, each having:
#* product_code, order_qty, sales_unit, plant, storage_location,
#* order_dow, delivery_dow, lead_time, month, coinciding_delivery
#*
#* Example:
#* [
#*   {
#*     "product_code": "12345",
#*     "order_qty": 100,
#*     "sales_unit": "KG",
#*     "plant": "30588",
#*     "storage_location": "A01",
#*     "order_dow": "Mon",
#*     "delivery_dow": "Wed",
#*     "lead_time": 2,
#*     "month": "01",
#*     "coinciding_delivery": "0"
#*   }
#* ]
#*
#* @post /predict
#* @serializer unboxedJSON
function(req) {
  tryCatch({
    if (is.null(req$postBody) || req$postBody == "") {
      return(list(error = "Empty request body"))
    }
    
    payload <- tryCatch(
      jsonlite::fromJSON(req$postBody, simplifyDataFrame = TRUE),
      error = function(e) NULL
    )
    
    if (is.null(payload)) {
      return(list(error = "Invalid JSON payload"))
    }
    
    # Handle both single-object and array-of-objects
    if (is.data.frame(payload)) {
      new_df <- payload
    } else if (is.list(payload)) {
      # If payload is a list of records
      new_df <- as.data.frame(payload, stringsAsFactors = FALSE)
    } else {
      return(list(error = "Unsupported payload structure"))
    }
    
    X_new <- make_design_matrix(new_df)
    dnew  <- xgb.DMatrix(data = X_new)
    probs <- predict(final_model, dnew)
    
    preds <- ifelse(probs >= 0.5, 1L, 0L)
    
    # Convert predictions to list of records
    # Build list with atomic values (not vectors)
    pred_list <- vector("list", length(probs))
    for (i in 1:length(probs)) {
      pred_list[[i]] <- list(
        prob_failure = as.numeric(probs[i]),
        predicted_failure = as.integer(preds[i])
      )
    }
    
    # Return as list with proper types
    # length() always returns a scalar, so this should be fine
    list(
      n = length(probs),
      predictions = pred_list
    )
  }, error = function(e) {
    list(error = paste("Prediction failed:", conditionMessage(e)))
  })
}

