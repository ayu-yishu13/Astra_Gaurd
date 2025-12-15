from fpdf import FPDF
import pandas as pd, os
from utils.logger import log_path

class NIDSReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 18)
        self.cell(0, 10, "NIDS - Network Intrusion Detection Report", ln=True, align="C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 9)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

def generate_pdf_bytes(n=300):
    """Generate PDF summary of recent events."""
    df = pd.read_csv(log_path) if os.path.exists(log_path) else pd.DataFrame()

    pdf = NIDSReportPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font("Helvetica", "", 12)

    pdf.cell(0, 10, f"Last {n} Events Summary", ln=True)
    pdf.ln(5)

    if len(df) == 0:
        pdf.cell(0, 10, "No data available.", ln=True)
    else:
        df = df.tail(n)
        counts = df["prediction"].value_counts().to_dict() if "prediction" in df.columns else {}

        pdf.cell(0, 10, "Prediction Distribution:", ln=True)
        pdf.ln(4)
        for label, count in counts.items():
            pdf.cell(0, 10, f"{label}: {count}", ln=True)

        pdf.ln(8)
        pdf.cell(0, 10, "Sample Events:", ln=True)
        pdf.ln(4)

        # limit to 10 sample rows
        cols = ["time", "src", "dst", "proto", "prediction"]
        cols = [c for c in cols if c in df.columns]
        for _, row in df.tail(10).iterrows():
            line = " | ".join(str(row[c]) for c in cols)
            if len(line) > 150:
                line = line[:147] + "..."
                pdf.multi_cell(0, 8, line)

    # return as bytes
    output = pdf.output(dest="S")
    if isinstance(output, (bytes, bytearray)):
        return bytes(output)
    else:
        return bytes(output.encode("latin1", "ignore"))

