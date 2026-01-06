# Loan Approval Policy Modeling + Anomaly Detection

> Reverse-engineering a bank’s loan approval policy from ~20k historical decisions, then using it as a **policy mirror** to flag **high-confidence exceptions** for human review.

---

## 1. Project TL;DR

This project:

1. Takes a synthetic but bank-like portfolio of ~20,000 loan applications.  
2. Learns an **interpretable approval model** (logistic regression) that mimics the bank’s historical decisions.  
3. Uses that model as a **policy mirror** to surface **anomalies**:
   - Cases that **look strongly approvable** according to the model but were **rejected**.
   - Cases that **look strongly rejectable** according to the model but were **approved**.

Result: instead of re-underwriting the entire book, risk and QA get a **short, high-signal exception queue** to focus on.

---

## 2. Motivation

Most banks have written policies, but the **real approval policy** lives in:

- Underwriter judgment  
- Informal rules of thumb  
- Local deviations from guidelines

Over time, this leads to:

- Inconsistent treatment of **medium-risk** customers  
- Good business being rejected  
- Quiet accumulation of bad risk

This project shows how to:

- Turn historical decisions into an **auditable policy model**  
- Map how approvals actually behave across **risk** and **affordability** segments  
- Flag **off-pattern decisions** for review, without replacing human judgment

---

## 3. Dataset

- ~20,000 synthetic loan applications (single CSV).  
- Each row is a **loan application**, with:
  - Customer characteristics (income, credit/risk scores, etc.)
  - Loan economics (amount, duration, etc.)
  - Behavioural / affordability measures (e.g. debt-to-income)
  - Final decision: `LoanApproved` (0/1)

The dataset is synthetic but structured to resemble a real unsecured lending portfolio.

---

## 4. Technical Stack

**Languages & Core Libraries**

- Python: `pandas`, `numpy`, `matplotlib` / `seaborn`, `scikit-learn`
- SQL: PostgreSQL (hosted on **Neon**)
- Python ↔ SQL: `SQLAlchemy` (plus the relevant DB driver, e.g. `psycopg2-binary`)

**Presentation**

- **Jupyter Notebook**: full exploratory data analysis (EDA), modelling, and anomaly logic  
- **Static site (this repo’s front-end)**:
  - `index.html` – project page with multi-section layout
  - `template.css` – glassmorphism / layout styling
  - `template.js` – navigation, background animations, small UX effects
  - `figures/` – PNG plots exported from the notebook and embedded in the site

---

## 5. Architecture & Pipeline

The end-to-end flow is:

1. **Raw data → Python (pandas)**  
   - Load the CSV into a DataFrame  
   - Sanity-check schema, ranges, missing values

2. **Python → PostgreSQL (Neon)** *(optional but implemented here)*  
   - Push the DataFrame into a Neon Postgres instance as a `loan_data` table  
   - Postgres becomes the **single source of truth**

3. **Feature engineering in SQL**  
   - Derive business-friendly features:
     - `risk_band` from `RiskScore` (Low / Medium / High)  
     - `income_band` (e.g. `<30k`, `30–60k`, `60–100k`, `100k+`)  
     - `loan_amount_band`  
     - `duration_band`  
     - `payment_to_income_ratio` (monthly payment ÷ monthly income)
   - This is done at the database layer to show how **logic scales** when data grows and/or multiple files join together.

4. **Model dataset in Python**  
   - Pull the enriched table back into pandas as `model_df`
   - Select:
     - Numeric features: risk/credit scores, DTI, income, amount, duration, behaviour variables  
     - Categorical features: the engineered bands  
     - Target: `LoanApproved`

5. **Modelling (Logistic Regression)**  
   - Build a scikit-learn `Pipeline`:
     - Numeric: `StandardScaler`
     - Categorical: `OneHotEncoder`
     - Model: `LogisticRegression(max_iter=1000)`
   - Train/validation split  
   - Evaluate:
     - Accuracy, ROC-AUC
     - Confusion matrix
     - Per-class precision/recall

6. **Policy mirror & anomaly flags**  
   - Compute `pred_approval_prob` = P(LoanApproved = 1 | features)
   - Use probabilities as a **mirror** of bank behavior:
     - Where the model is very confident, but history disagrees, we flag anomalies.

7. **Visuals & storytelling**  
   - Generate:
     - Approval **heatmap** (risk vs income)
     - Affordability **boxplots** (e.g. payment-to-income for Medium risk)
     - Calibration plots by probability band
     - Exception counts by anomaly type  
   - Export to `figures/` and reuse both in the notebook and the website.

---

## 6. Why Use SQL/Neon When a CSV → pandas Load Is Enough?

For this particular dataset, the simplest path is:

```text
CSV → pandas DataFrame → feature engineering in Python → model
```

However, this project deliberately goes the **longer route**:

```text
CSV → pandas → Neon PostgreSQL → SQL feature engineering → back to pandas
```

**Reason:** to demonstrate **SQL + data engineering skills** and show how this would scale when:

- You have **multiple CSVs / tables** (e.g. applications, bureau, transactions, outcomes)  
- Data volume grows beyond what’s practical to preprocess purely in-memory  
- You want a **shared, queryable data source** for other teams and tools

In other words, in *this* dataset it’s not strictly required, but it mirrors what you’d do in a real production environment.

If you want to keep it simple when running locally, you can **skip the SQL step** and load directly from CSV into pandas, as the modelling logic itself does not depend on the database.

---

## 7. Anomaly Logic: “Policy Mirror” in Practice

Once the logistic regression model is trained and calibrated, we use the predicted approval probabilities to define **high-confidence exceptions**, especially in the **Medium-risk** segment.

For each loan:

- `pred_approval_prob` = model’s probability that the loan should be approved  
- `LoanApproved` = historical decision (0/1)

We define:

- **High-confidence under-approval**  
  - `pred_approval_prob ≥ 0.90`  
  - but `LoanApproved == 0`  
  - *Model says: “this looks like a clear approve”, history says: “rejected”*

- **High-confidence over-approval**  
  - `pred_approval_prob ≤ 0.10`  
  - but `LoanApproved == 1`  
  - *Model says: “this looks like a clear reject”, history says: “approved”*

These flags create a compact **exception queue** for:

- QA / second-line review  
- Policy discussion (are the exceptions justified?)  
- Potential remediation (e.g. reach out to under-approved but strong applicants)

---

## 8. Key Visuals

The project includes several core plots (exported to `figures/`):

1. **Policy heatmap: Risk vs Income**  
   - Group by `risk_band` × `income_band`  
   - Plot mean `LoanApproved` (approval rate) as a heatmap  
   - Shows the **top-level fingerprint** of approval behavior.

2. **Affordability lens: Medium-risk payment-to-income**  
   - Filter to `risk_band == "Medium"`  
   - Boxplot of `payment_to_income_ratio` split by `LoanApproved`  
   - Shows how strictly affordability rules are applied in the most judgment-heavy segment.

3. **Model calibration by probability band**  
   - Bucket `pred_approval_prob` into `<10%`, `10–90%`, `>90%`  
   - For each band, compute actual approval rate  
   - Checks whether “low”, “medium”, and “high” model probabilities correspond to reality.

4. **Exception patterns: high-confidence anomalies**  
   - Bar chart of counts:
     - High-confidence under-approvals
     - High-confidence over-approvals  
   - Ensures the exception list is **small but meaningful**, rather than noisy.

---

## 9. Repository Structure

A typical layout for this project:

```text
.
├── NeonSqlUpload.py         # Python script to push CSV → Neon Postgres (loan_data table)
├── projectnotebook.ipynb    # Main Jupyter notebook: EDA, modelling, anomaly logic
├── index.html               # Project landing page (GitHub Pages compatible)
├── template.css             # Styling (glassmorphism, layout, responsiveness)
├── template.js              # Front-end interactivity (tabs, parallax, ripple)
├── figures/                 # Exported PNG plots used in the page + README
│   ├── bar_feature_importance_top10.png
│   ├── heatmap_risk_income.png
│   ├── boxplot_medium_pti.png
│   ├── bar_prob_band_calibration.png
│   └── bar_exceptions_counts.png
└── data/
    └── loans.csv            # Synthetic input dataset (example name; adjust to match repo)
```

---

## 10. How to Run Locally

### 10.1. Clone the repo

```bash
git clone https://github.com/MNN1999/ML-Loan-Analysis.git
cd ML-Loan-Analysis
```

### 10.2. Set up Python environment

```bash
python -m venv .venv
source .venv/bin/activate     # On Windows: .venv\Scripts\activate
pip install -r requirements.txt  # if provided
```

If there is no `requirements.txt`, install at least:

```bash
pip install pandas numpy scikit-learn matplotlib seaborn SQLAlchemy psycopg2-binary jupyter
```

### 10.3. Option A – Run everything via CSV only (simpler)

1. Open the notebook:

   ```bash
   jupyter notebook projectnotebook.ipynb
   ```

2. In the notebook, load the CSV directly into pandas (if not already set up) and run through:
   - EDA
   - Feature engineering
   - Model training
   - Anomaly detection
   - Plot generation

### 10.4. Option B – Use Neon PostgreSQL (full pipeline)

1. Create a Neon PostgreSQL database and grab the connection string.  
2. Set it as an environment variable, e.g.:

   ```bash
   export DATABASE_URL="postgresql+psycopg2://user:password@host/dbname"
   ```

3. Run the upload script:

   ```bash
   python NeonSqlUpload.py
   ```

   This should:

   - Read the CSV into pandas
   - Create/populate a `loan_data` table on Neon via SQLAlchemy

4. Run the notebook:

   ```bash
   jupyter notebook projectnotebook.ipynb
   ```

   The notebook:

   - Queries the enriched table (with SQL-derived features)
   - Trains the model and generates anomalies & plots

---

## 11. Interpretation & Extensions

This project already:

- Reconstructs the **implicit approval policy** using an interpretable model  
- Makes that policy **visible** across risk & income/affordability dimensions  
- Surfaces a small list of **high-confidence exceptions** worth review

Natural next steps:

1. **Connect to real outcomes**  
   - Join applications to default / loss data  
   - Validate whether anomalies also have unusual performance

2. **Cost-based thresholds**  
   - Move from arbitrary 10% / 90% cut-offs to thresholds based on:
     - Expected loss
     - Customer value
     - Capital / funding constraints

3. **Operationalizing QA**  
   - Run this as a **scheduled control**:
     - Monthly / weekly anomaly report
     - Ownership by risk/QA
     - Feedback loop into policy, training, and system rules

4. **Fairness & bias checks** (if sensitive attributes available)  
   - Compare approval rates and anomaly rates across demographic segments  
   - Integrate fairness metrics alongside risk metrics

---

## 12. How to Read the Project

Recommended order:

1. **README (this file)** – high-level story  
2. **Jupyter Notebook** – detailed implementation, EDA, and model training  
3. **Static Site (`index.html`)** – polished narrative with key visuals  
4. **SQL / NeonScript (`NeonSqlUpload.py`)** – data engineering and pipeline setup

---

## 13. Contact

- **Author:** M. Nabeel Numan  
- **GitHub:** https://github.com/MNN1999/ML-Loan-Analysis  
- **LinkedIn:** https://www.linkedin.com/in/mnn99  
- **Email:** nabeelnuman9999@gmail.com
