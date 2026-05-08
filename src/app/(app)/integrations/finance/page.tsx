import { uploadFinanceCsv } from "./actions";
import { CsvUploader } from "./CsvUploader";

export default function FinanceIntegrationPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Finanzas — CSV / Sheets</h1>
        <p className="text-sm text-muted-foreground">
          Sube un CSV con columnas <code>date</code> (o <code>fecha</code>),{" "}
          <code>amount</code> (o <code>monto</code>) y <code>description</code>. Montos
          negativos se tratan como gastos.
        </p>
      </header>
      <CsvUploader upload={uploadFinanceCsv} />
    </div>
  );
}
