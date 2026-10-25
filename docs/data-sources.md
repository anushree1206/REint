# Elexon Insights API: Data Sources, Field Mappings, and Methodology

## 1. Overview and Objective
This document specifies the official datasets, endpoints, field schemas, alignment transformations, and analytical limitations used by **WindLens**, the wind-energy decision support platform for energy buyers and traders operating in the Great Britain (GB) electricity market during January 2026.

All source data is queried directly from the **Elexon Insights Solution API** (`https://data.elexon.co.uk/bmrs/api/v1`), the authoritative successor to the legacy Balancing Mechanism Reporting Service (BMRS), operated by Elexon and National Energy System Operator (NESO).

---

## 2. Selected Datasets and Endpoints

### 2.1 Actual Wind Generation (`FUELHH`)
- **API Endpoint:**  
  `GET https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH`
- **Query Parameters:**
  - `settlementDateFrom`: `YYYY-MM-DD`
  - `settlementDateTo`: `YYYY-MM-DD`
  - `fuelType`: `WIND`
- **Description:**  
  Half-hourly outturn generation for wind farms visible to the central settlement system and transmission network.
- **Granularity & Resolution:**  
  Half-hourly (30-minute intervals). There are 48 settlement periods per standard calendar day (SP 1 through SP 48).
- **Physical Unit:**  
  Megawatts (MW) average active power over the 30-minute interval.
- **Query Limits & Validation:**  
  The Elexon API enforces a maximum date range limit on single queries (typically $\le 7$ days). Requests covering the full month of January 2026 (1 Jan to 31 Jan) must be queried in sequential 7-day chunks (e.g. 1–7, 8–14, 15–21, 22–28, 29–31) and concatenated.
- **Key Response Fields:**
  - `dataset`: Always `"FUELHH"`
  - `publishTime`: Timestamp when settlement data was posted (`YYYY-MM-DDTHH:MM:SSZ`)
  - `startTime`: Interval start timestamp (`YYYY-MM-DDTHH:MM:SSZ`)
  - `settlementDate`: Calendar date of delivery (`YYYY-MM-DD`)
  - `settlementPeriod`: Integer 1 through 48
  - `fuelType`: `"WIND"`
  - `generation`: Average power output in MW (float or int)

---

### 2.2 Wind Generation Forecasts (`WINDFOR`)
- **API Endpoints:**
  1. `GET https://data.elexon.co.uk/bmrs/api/v1/forecast/generation/wind/latest`  
     *Parameters:* `from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z`  
     *Semantics:* Returns the latest available forecast record for each delivery hour. For historical evaluation, this represents the post-event revised forecast issued closest to delivery.
  2. `GET https://data.elexon.co.uk/bmrs/api/v1/forecast/generation/wind/earliest`  
     *Parameters:* `from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z`  
     *Semantics:* Returns the earliest published forecast vintage for each delivery hour, published ~45 to ~66 hours prior to delivery (day -2).
  3. `GET https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR`  
     *Parameters:* `publishDateTimeFrom=...&publishDateTimeTo=...`  
     *Semantics:* Raw publication runs of the National Grid / NESO wind forecast model, updated up to 8 times daily (02:30, 04:30, 07:30, 09:30, 11:30, 15:30, 18:30, 22:30 UTC).
- **Forecast Granularity & Resolution:**  
  Hourly intervals (24 forecast points per day). Each hourly record corresponds to the odd settlement periods (SP 1, 3, 5, ..., 47) spanning two 30-minute settlement periods.
- **Physical Unit:**  
  Megawatts (MW) average generation.
- **Key Response Fields:**
  - `publishTime`: ISO 8601 timestamp when the forecast was issued/published.
  - `startTime`: ISO 8601 timestamp of delivery hour start.
  - `settlementDate`: Calendar date of delivery (`YYYY-MM-DD`).
  - `settlementPeriod`: Integer (1, 3, 5, ..., 47).
  - `generation`: Predicted wind generation in MW.

---

## 3. Data Alignment and Temporal Matching

### 3.1 Interval Harmonization
Because actual generation (`FUELHH`) is measured at half-hourly resolution (48 settlement periods) while National Grid wind forecasts are produced at hourly resolution (24 points), direct 1:1 matching requires sound physical aggregation:
- Each hourly forecast interval starting at hour $H$ (settlement period $2k - 1$) covers two half-hour settlement periods: $\text{SP}_{2k-1}$ and $\text{SP}_{2k}$.
- The actual hourly generation is calculated as the unweighted arithmetic mean of the two half-hourly outturn readings:
  $$\text{Actual}_{\text{hour}} = \frac{\text{Generation}(\text{SP}_{2k-1}) + \text{Generation}(\text{SP}_{2k})}{2}$$
- If one half-hour within an hour is missing from source data, the available half-hour is flagged and data coverage metrics reflect the partial observation. If both are missing, the hourly interval is preserved as `null` / `NaN` (never silently converted to zero).

### 3.2 Timezone and Calendar Conventions
- **Timezone:** All timestamps are normalized to Universal Coordinated Time (UTC / GMT).
- **January 2026 Period:** The UK observed Greenwich Mean Time (GMT) throughout January 2026 (clock offset UTC+00:00). No daylight saving adjustments occurred in this period.
- **Date Boundaries:** Analysis period starts `2026-01-01T00:00:00Z` and ends `2026-01-31T23:59:59Z` inclusive (744 delivery hours across 31 days).

---

## 4. Forecast Horizons and Vintage Disclosure

In day-ahead electricity markets (such as EPEX SPOT GB or Nord Pool GB auctions):
- The day-ahead auction gate closure occurs around **11:00–12:00 UTC on day $D-1$** for delivery on day $D$ (00:00 to 24:00).
- Post-auction bilaterally traded volumes and scheduling adjustments occur through the afternoon of $D-1$ up to intra-day gate closure (1 hour before each delivery period).

### 4.1 Forecast Vintages Compared:
1. **Day-Ahead Vintage (Primary Analysis Benchmark):**  
   The forecast published on day $D-1$ before delivery day $D$ commences (specifically the 15:30 or 18:30 UTC NESO publication runs, or the earliest vintage available prior to $D$). This guarantees zero look-ahead bias.
2. **Latest Revised Vintage:**  
   The final updated forecast issued prior to or at delivery. Disclosed as an operational benchmark to illustrate how forecast accuracy evolves as the delivery hour approaches.
3. **Earliest Vintage:**  
   The initial forecast issued by NESO 48–66 hours prior to delivery.

---

## 5. Mathematical Metrics & Formulas

1. **Forecast Error:**
   $$\text{Error}_t = \text{Forecast}_t - \text{Actual}_t$$
   - $\text{Error} > 0$: **Overforecast** (forecast exceeded actual; actual wind generation was weaker than anticipated).
   - $\text{Error} < 0$: **Underforecast** (actual generation exceeded forecast).

2. **Absolute Error:**
   $$\text{AbsError}_t = |\text{Forecast}_t - \text{Actual}_t|$$

3. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{N} \sum_{t=1}^N |\text{Forecast}_t - \text{Actual}_t|$$

4. **Root Mean Squared Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^N (\text{Forecast}_t - \text{Actual}_t)^2}$$

5. **Forecast Bias (Mean Error):**
   $$\text{Bias} = \frac{1}{N} \sum_{t=1}^N (\text{Forecast}_t - \text{Actual}_t)$$
   - Positive bias indicates systematic over-forecasting of wind generation.
   - Negative bias indicates systematic under-forecasting.

6. **Mean Absolute Percentage Error (MAPE) Policy:**
   $$\text{MAPE} = \frac{1}{|T_{\text{valid}}|} \sum_{t \in T_{\text{valid}}} \frac{|\text{Forecast}_t - \text{Actual}_t|}{\text{Actual}_t} \times 100\%$$
   *Zero & Near-Zero Policy:* When $\text{Actual}_t < 100\,\text{MW}$, percentage error produces mathematical singularities ($x / 0$) or distorted ratios exceeding $1000\%$. Therefore, intervals where $\text{Actual}_t < 100\,\text{MW}$ are excluded from MAPE, and the number of excluded low-wind intervals is explicitly published.

7. **Weighted Absolute Percentage Error (WAPE):**
   $$\text{WAPE} = \frac{\sum_{t=1}^N |\text{Forecast}_t - \text{Actual}_t|}{\sum_{t=1}^N \text{Actual}_t} \times 100\%$$
   WAPE provides a stable volume-weighted error metric that is resilient to low-denominator anomalies and directly reflects portfolio-level energy imbalance.

8. **Data Coverage:**
   $$\text{Coverage} = \frac{N_{\text{matched}}}{N_{\text{expected}}} \times 100\% \quad (N_{\text{expected}} = 744\,\text{hours})$$

---

## 6. Analytical Limitations & Disclaimers

1. **Embedded vs Transmission-Connected Wind:**  
   `FUELHH` captures transmission-connected and centrally metered wind generation. Some embedded distribution-connected wind generation is treated as negative demand by the system operator.
2. **Decision Support, Not Guaranteed Financial P&L:**  
   Implications for day-ahead purchasing decisions (e.g. potential open positions, exposure to cashout / System Buy Price / System Sell Price) are analytical risk interpretations. Generation forecast errors alone do not dictate imbalance settlement cashflows without paired System Price, market spread, and contracted volume data.
3. **Data Completeness:**  
   No missing records are converted to zero. All gaps are transparently reported in data quality statistics.
