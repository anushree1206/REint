# WindLens --- UK Wind Energy Decision Support

WindLens is a full-stack dashboard for comparing actual wind generation
with wind generation forecasts in Great Britain. It focuses on January
2026 and helps users explore forecast accuracy, identify large
deviations, and understand possible implications for day-ahead
electricity purchasing.

> **Important:** WindLens is a decision-support prototype. Its
> rule-based purchasing suggestions are illustrative, not automated
> trading instructions or a guarantee of financial results.

## Live application
**Deployed app:** `https://reint-beryl.vercel.app/`

## Problem this project addresses

Electricity buyers make purchasing decisions before electricity is
delivered. Wind generation can differ from its forecast, so buyers need
to understand both the forecast available at decision time and how
accurate forecasts have been historically.

WindLens is designed to help users:

-   Compare actual wind generation with forecast generation.
-   Review summary forecast-performance metrics.
-   Explore error patterns by time of day and by delivery date.
-   Find the largest forecast deviations.
-   Review transparent, rule-based purchasing-risk observations.
-   Understand the data sources, matching process, formulas, and
    limitations.

The analysis period is **1 January 2026 through 31 January 2026**.

## Features

### Overview

-   Summary cards for actual generation, forecast volume, MAE, WAPE,
    forecast bias, and data coverage.
-   Time-series chart comparing actual outturn and forecast generation.
-   Deviation chart showing positive and negative forecast errors.
-   Rule-based observations and largest deviation events.

### Forecast Accuracy

-   MAE, RMSE, WAPE, and forecast-bias metrics.
-   Hour-of-day (diurnal) profile.
-   Forecast-error distribution histogram.
-   Daily accuracy and volume ledger.

### Purchasing Deviations

-   Overforecast and underforecast explanations.
-   Ranked deviation events with error magnitude and severity.
-   Rule-based day-ahead purchasing playbook.
-   Filters for deviation direction and severity.

### Data & Methodology

-   Source datasets and data provenance notes.
-   Interval alignment explanation.
-   Forecast-vintage descriptions.
-   Metric formulas, missing-data policy, and operational limitations.

## Technology stack

  Area                                       Technologies
  ------------------------------------------ ------------------------------------
  Frontend                                   React, TypeScript, Vite
  Charts and icons                           Recharts, Lucide React
  Styling                                    Tailwind CSS
  Frontend development server/API fallback   Node.js, Express, Vite
  Python backend                             Python, FastAPI, Uvicorn, Pydantic
  Data processing                            Pandas, NumPy
  HTTP client                                HTTPX
  Tests                                      Pytest
  Containers                                 Docker, Docker Compose, Nginx
  External data                              Elexon Insights Solution API

## Architecture and data flow

``` text
Elexon API
  ├── FUELHH: actual wind generation (half-hourly)
  └── WINDFOR / wind forecast endpoints
             |
             v
      Data client and cache
             |
             v
   Interval alignment and validation
   - Group half-hour actuals into hours
   - Match actuals with forecast periods
   - Preserve missing observations
             |
             v
       Analytics functions
   - Forecast error and absolute error
   - MAE, RMSE, WAPE, MAPE, bias
   - Daily/hourly summaries and deviations
   - Rule-based observations
             |
             v
        API responses
             |
             v
 React + TypeScript dashboard
   - KPI cards, charts, tables
   - Filters, event details, methodology
```

The repository includes a Python FastAPI backend and also a Node/Express
development server (`server.ts`) that serves the Vite frontend and
provides local API/fallback functionality. The frontend API client can
fall back to embedded local analytics if an API request fails. For this
reason, verify the active data path before describing a displayed result
as freshly retrieved from Elexon.

## Repository structure

``` text
.
├── backend/
│   ├── app/
│   │   ├── analytics/
│   │   │   └── metrics.py          # Forecast metrics and analytical calculations
│   │   ├── api/
│   │   │   └── routes.py           # FastAPI endpoints
│   │   ├── clients/
│   │   │   └── elexon.py           # Elexon API client and cache handling
│   │   ├── core/
│   │   │   └── config.py           # Backend configuration and defaults
│   │   ├── models/
│   │   │   └── schemas.py          # Response/data schemas
│   │   ├── services/
│   │   │   └── wind_service.py     # Data preparation and analytics orchestration
│   │   └── main.py                 # FastAPI application entry point
│   ├── data/
│   │   └── cache/                  # Cached Elexon response JSON files
│   ├── tests/
│   │   ├── test_alignment.py      # Interval matching tests
│   │   ├── test_api_endpoints.py  # API tests
│   │   └── test_metrics.py        # Metric calculation tests
│   ├── Dockerfile                  # Backend container definition
│   └── requirements.txt            # Python dependencies
├── docs/
│   └── data-sources.md             # Source datasets and methodology details
├── src/
│   ├── api/
│   │   ├── client.ts               # Frontend API client and fallback handling
│   │   └── localAnalytics.ts       # Local fallback analytics
│   ├── components/                 # Shared cards, charts, tables, and panels
│   ├── data/
│   │   └── embeddedData.ts         # Embedded records used by frontend fallback
│   ├── pages/
│   │   ├── OverviewPage.tsx
│   │   ├── AccuracyPage.tsx
│   │   ├── DeviationsPage.tsx
│   │   └── MethodologyPage.tsx
│   ├── types/
│   │   └── index.ts                # TypeScript types/interfaces
│   ├── App.tsx                     # Main app state and page layout
│   ├── index.css                   # Global styling
│   └── main.tsx                    # React entry point
├── server.ts                       # Express + Vite dev server and local API handlers
├── package.json                   # Node scripts and dependencies
├── package-lock.json              # Locked Node dependency versions
├── vite.config.ts                 # Vite configuration
├── index.html                     # Frontend HTML entry point
├── frontend.Dockerfile             # Frontend build and Nginx serving
├── docker-compose.yml              # Frontend/backend container orchestration
├── .gitignore                     # Files excluded from Git
└── README.md
```

## Data sources

WindLens uses the following Elexon data:

-   **Actual wind generation:** `FUELHH`, filtered to `fuelType=WIND`.
    Actual readings are provided at 30-minute resolution.
-   **Wind generation forecasts:** `WINDFOR` and the Elexon wind
    forecast endpoints. Forecast values are hourly and include
    publication timestamps for vintage analysis.

Official API documentation and data endpoint base:

-   [Elexon Insights Solution
    API](https://data.elexon.co.uk/bmrs/api/v1)
-   [FUELHH dataset
    documentation](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream)
-   [WINDFOR dataset
    documentation](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream)

More detail is available in
[`docs/data-sources.md`](docs/data-sources.md).

### Interval matching

Actual generation is half-hourly while the selected forecasts are
hourly. For an hour covering settlement periods `SP 1` and `SP 2`, the
project uses the average of the two actual readings:

``` text
Actual hourly MW = (Actual SP odd + Actual SP even) / 2
Forecast error   = Forecast MW - Actual hourly MW
```

All timestamps should be interpreted consistently in UTC for the January
2026 period. Missing records should not silently be replaced with zero;
coverage and missing values need to be checked when interpreting the
results.

### Forecast vintages

The interface offers three forecast-vintage choices:

-   **Day-Ahead (D-1):** intended to represent a forecast available
    before the delivery day.
-   **Latest Revised:** used to inspect the latest/revised forecast and
    compare how accuracy changes nearer delivery.
-   **Earliest (D-2):** an earlier forecast used as a longer-lead
    comparison.

For decision-time evaluation, confirm that the selected publication
timestamp was actually available before the relevant purchasing cutoff.
A later forecast must not be treated as information that was available
to the buyer earlier.

## Metrics

Let `F` be forecast generation, `A` be actual generation, and `N` be the
number of valid matched observations.

  -----------------------------------------------------------------------
  Metric                              Meaning
  ----------------------------------- -----------------------------------
  Signed error                        `F - A`; positive means
                                      overforecast, negative means
                                      underforecast

  Absolute error                      `abs(F - A)`

  MAE                                 Average absolute error

  RMSE                                Square root of the average squared
                                      error; larger errors receive more
                                      weight

  Forecast bias                       Average signed error; indicates the
                                      overall direction of error

  WAPE                                Sum of absolute errors divided by
                                      sum of actual generation,
                                      multiplied by 100

  MAPE                                Average absolute percentage error
                                      for eligible intervals; actual
                                      values below 100 MW are excluded by
                                      the project's policy

  Data coverage                       Matched valid intervals divided by
                                      expected intervals, multiplied by
                                      100
  -----------------------------------------------------------------------

The metrics describe forecast performance. They do not, by themselves,
calculate a buyer's realized financial loss or prove that a particular
purchasing strategy would be profitable.

## Requirements

### Option A --- Run the local development app

Install:

-   Node.js 20 or later (and npm).
-   Python 3.10 or later.
-   Internet access if the application needs to retrieve data from
    Elexon.

1.  Clone the repository and enter the project directory:

    ``` bash
    git clone <YOUR_PUBLIC_GITHUB_REPOSITORY_URL>
    cd <YOUR_PROJECT_DIRECTORY>
    ```

2.  Install Node dependencies:

    ``` bash
    npm install
    ```

3.  Install Python backend dependencies if you plan to run or test the
    FastAPI backend separately:

    ``` bash
    python -m pip install -r backend/requirements.txt
    ```

4.  Start the local development server:

    ``` bash
    npm run dev
    ```

5.  Open the dashboard:

    ``` text
    http://localhost:3000
    ```

The `dev` script runs `server.ts`, which starts the Express/Vite
development application and its local API handlers. It is not the same
as launching the standalone FastAPI service.

### Option B --- Run the FastAPI backend directly

From the repository root, install the Python dependencies and run:

``` bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload
```

Useful URLs:

-   API health: `http://localhost:8001/health`
-   Interactive API documentation: `http://localhost:8001/docs`

The FastAPI backend uses `ELEXON_BASE_URL` and `REQUEST_TIMEOUT_SECONDS`
environment variables, with defaults defined in
`backend/app/core/config.py`.

### Option C --- Run with Docker Compose

Install Docker Desktop (or Docker Engine with the Compose plugin), then
run from the repository root:

``` bash
docker compose up --build
```

Open:

-   Frontend: `http://localhost:3000`
-   Backend health: `http://localhost:8001/health`
-   FastAPI API docs: `http://localhost:8001/docs`

Stop the containers with:

``` bash
docker compose down
```

Docker Compose mounts `backend/data/cache` so cached data can persist
across container restarts. The frontend container serves the built React
app through Nginx and proxies API/health requests to the backend
service.

## API endpoints

The Python FastAPI API is mounted under `/api/v1`. The principal routes
include:

  ---------------------------------------------------------------------------------
  Method                  Endpoint                      Purpose
  ----------------------- ----------------------------- ---------------------------
  GET                     `/health`                     Service, cache, and
                                                        upstream status

  GET                     `/api/v1/summary`             Summary metrics for a date
                                                        range and vintage

  GET                     `/api/v1/timeseries`          Interval-level actuals,
                                                        forecasts, and errors

  GET                     `/api/v1/forecast-accuracy`   Accuracy breakdown and
                                                        hourly/error-distribution
                                                        data

  GET                     `/api/v1/deviations`          Ranked forecast deviations

  GET                     `/api/v1/insights`            Rule-based observations
  ---------------------------------------------------------------------------------

Example request:

``` text
http://localhost:8001/api/v1/summary?start_date=2026-01-01&end_date=2026-01-31&vintage=DAY_AHEAD
```

Supported vintage values in the API are `DAY_AHEAD`, `LATEST`, and
`EARLIEST` where supported by the endpoint.

## Tests and code quality

Run the backend tests from the repository root:

``` bash
python -m pytest backend/tests/ -v
```

The `package.json` also provides this script:

``` bash
npm run test:backend
```

The tests are organized around:

-   Metric formulas and forecast-error sign convention.
-   Hourly alignment of half-hour settlement periods.
-   API response structure and endpoint behavior.

To run the TypeScript type check:

``` bash
npm run lint
```

To build the frontend:

``` bash
npm run build
```

Run these commands in your own environment before claiming that all
checks pass; this README does not assert that they have been executed
successfully in every environment.

## Configuration and secrets

-   Do not commit `.env`, API keys, tokens, passwords, or other secrets.
-   The repository's `.gitignore` excludes `.env*` files except
    `.env.example`.
-   If environment configuration is needed, create a safe `.env.example`
    containing variable names and non-secret example values only.
-   `VITE_API_BASE_URL` can be used to configure the frontend API base
    URL where required.
-   Restrict CORS to the intended frontend origin before production use.
-   Check API/cache fallback behavior so the UI does not mislabel cached
    or embedded data as freshly retrieved live data.

## Deployment

The assignment asks for a public deployment on Vercel or Heroku. Add the
actual working deployment URL near the top of this README before
submitting.

The project contains Docker configuration for a frontend served by Nginx
and a Python FastAPI backend. Deploying the frontend and backend may
require separate service configuration, environment variables, and an
API base URL. Verify the deployed app in an incognito/private browser
window before submitting it.

**Deployment URL to replace before submission:**
`ADD_YOUR_VERCEL_OR_HEROKU_URL_HERE`

## AI-assisted development disclosure

AI tools were used as development assistance for this project, including
**OpenAI ChatGPT** and **Google AI Studio/Gemini**. Assistance included
explaining implementation approaches, helping with code and debugging,
and drafting or improving documentation and interface ideas.

AI assistance does not replace code review or validation. Data
provenance, API behavior, forecast-vintage selection, metric
calculations, and the operational interpretation of results should be
checked against the source code and official data documentation.

## Limitations

-   The analysis is limited to national-level wind generation actuals
    and forecasts from Elexon for January 2026.
-   The data does not include full electricity demand, contracted buyer
    positions, wholesale order books, or System Buy/Sell Price time
    series.
-   Purchasing implications are illustrative risk interpretations, not
    realized financial outcomes or guaranteed recommendations.
-   Forecast-vintage selection and source-data provenance should be
    verified before using the results for real procurement decisions.
-   The frontend has embedded/fallback analytics; confirm which data
    path served a result when validating live behavior.

## License

No `LICENSE` file was present in the supplied project archive. Add the
license you intend to use before presenting the repository as formally
open source.
