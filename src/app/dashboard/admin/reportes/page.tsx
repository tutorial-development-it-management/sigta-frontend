"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearReporteDemo,
  DemoSeedResult,
  downloadReporteExcel,
  getErrorMessage,
  getRendimientoReport,
  RendimientoEstudiante,
  RendimientoReport,
  RendimientoTutor,
  ReporteCsvTipo,
  seedReporteDemo,
} from "@/lib/api";
import { cn } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Award,
  BarChart,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  FlaskConical,
  Star,
  Trash2,
  TrendingDown,
  User,
  Users,
  XCircle,
} from "lucide-react";

type Vista = "tutores" | "estudiantes" | "cancelaciones";

const VISTAS: { key: Vista; label: string; tipoCsv: ReporteCsvTipo }[] = [
  { key: "tutores",       label: "Rendimiento de tutores",      tipoCsv: "tutores" },
  { key: "estudiantes",   label: "Rendimiento de estudiantes",  tipoCsv: "estudiantes" },
  { key: "cancelaciones", label: "Detalle de cancelaciones",    tipoCsv: "cancelaciones" },
];

function formatDatetime(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function PctBadge({ value, tone }: { value: number; tone: "good" | "bad" | "neutral" }) {
  const palette = {
    good:    "bg-[#E6F4EA] text-[#1E7E34]",
    bad:     "bg-red-50 text-red-600",
    neutral: "bg-[#E8F0FE] text-[#1A5EB8]",
  }[tone];
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold", palette)}>
      {value.toFixed(1)}%
    </span>
  );
}

function StarsCell({ promedio }: { promedio: number | null }) {
  if (promedio === null) {
    return <span className="text-[11px] text-gray-400">Sin evaluaciones</span>;
  }
  const filled = Math.round(promedio);
  return (
    <span className="inline-flex items-center gap-1 text-[#FFC100]">
      <span className="tracking-tight">{"★".repeat(filled)}{"☆".repeat(5 - filled)}</span>
      <span className="text-[11px] text-[#0F2547] font-semibold">{promedio.toFixed(1)}</span>
    </span>
  );
}

interface TutoresTableProps {
  items: RendimientoTutor[];
}

function TutoresTable({ items }: TutoresTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="Sin datos de tutores"
        description="No hay sesiones registradas en el rango seleccionado."
      />
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#FAFBFC]">
            <tr>
              {["Tutor", "Sesiones", "Realizadas", "Canceladas", "% Cancelación", "% 5★", "Calificación"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.5px] border-b border-[#E5E7EB]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAFBFC]">
                <td className="px-4 py-2.5 text-[12px] text-[#0F2547]">
                  <p className="font-medium">{t.nombre}</p>
                  <p className="text-[11px] text-gray-400">{t.correo}</p>
                </td>
                <td className="px-4 py-2.5 text-[12px] text-gray-600">{t.sesiones_totales}</td>
                <td className="px-4 py-2.5 text-[12px] text-[#1E7E34] font-semibold">{t.realizadas}</td>
                <td className="px-4 py-2.5 text-[12px] text-red-600 font-semibold">{t.canceladas}</td>
                <td className="px-4 py-2.5">
                  <PctBadge value={t.tasa_cancelacion} tone={t.tasa_cancelacion > 25 ? "bad" : "neutral"} />
                </td>
                <td className="px-4 py-2.5">
                  {t.total_evaluaciones > 0 ? (
                    <div className="flex items-center gap-2">
                      <PctBadge
                        value={t.porcentaje_cinco_estrellas}
                        tone={t.porcentaje_cinco_estrellas >= 60 ? "good" : t.porcentaje_cinco_estrellas >= 30 ? "neutral" : "bad"}
                      />
                      <span className="text-[10px] text-gray-400">{t.cinco_estrellas}/{t.total_evaluaciones}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <StarsCell promedio={t.promedio_calificacion} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-[#E5E7EB] text-[11px] text-gray-400">
        {items.length} tutor{items.length === 1 ? "" : "es"}
      </div>
    </div>
  );
}

interface EstudiantesTableProps {
  items: RendimientoEstudiante[];
}

function EstudiantesTable({ items }: EstudiantesTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sin datos de estudiantes"
        description="No hay sesiones registradas en el rango seleccionado."
      />
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#FAFBFC]">
            <tr>
              {["Estudiante", "Sesiones", "Realizadas", "Canceladas", "% Cancelación", "% Asistencia"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.5px] border-b border-[#E5E7EB]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAFBFC]">
                <td className="px-4 py-2.5 text-[12px] text-[#0F2547]">
                  <p className="font-medium">{e.nombre}</p>
                  <p className="text-[11px] text-gray-400">{e.correo}</p>
                </td>
                <td className="px-4 py-2.5 text-[12px] text-gray-600">{e.sesiones_totales}</td>
                <td className="px-4 py-2.5 text-[12px] text-[#1E7E34] font-semibold">{e.realizadas}</td>
                <td className="px-4 py-2.5 text-[12px] text-red-600 font-semibold">{e.canceladas}</td>
                <td className="px-4 py-2.5">
                  <PctBadge value={e.tasa_cancelacion} tone={e.tasa_cancelacion > 25 ? "bad" : "neutral"} />
                </td>
                <td className="px-4 py-2.5">
                  <PctBadge value={e.tasa_asistencia} tone={e.tasa_asistencia >= 70 ? "good" : "neutral"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-[#E5E7EB] text-[11px] text-gray-400">
        {items.length} estudiante{items.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function CancelacionesTable({ items }: { items: RendimientoReport["cancelaciones"] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={BarChart}
        title="Sin tutorías canceladas"
        description="No se registran cancelaciones en el rango seleccionado."
      />
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#FAFBFC]">
            <tr>
              {["Fecha inicio", "Materia", "Tutor", "Estudiante", "Modalidad"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.5px] border-b border-[#E5E7EB]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAFBFC]">
                <td className="px-4 py-2.5 text-[11px] text-gray-500">{formatDatetime(c.fecha_hora_inicio)}</td>
                <td className="px-4 py-2.5 text-[12px] text-[#0F2547]">
                  {c.materia.nombre}
                  <p className="text-[11px] text-gray-400">{c.materia.codigo}</p>
                </td>
                <td className="px-4 py-2.5 text-[12px] text-[#0F2547]">
                  {c.tutor.nombre}
                  <p className="text-[11px] text-gray-400">{c.tutor.correo}</p>
                </td>
                <td className="px-4 py-2.5 text-[12px] text-[#0F2547]">
                  {c.estudiante.nombre}
                  <p className="text-[11px] text-gray-400">{c.estudiante.correo}</p>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-gray-500 capitalize">{c.modalidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-[#E5E7EB] text-[11px] text-gray-400">
        {items.length} cancelaciones
      </div>
    </div>
  );
}

export default function AdminReportesPage() {
  const [report, setReport] = useState<RendimientoReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<ReporteCsvTipo | null>(null);
  const [seeding, setSeeding] = useState<"seed" | "clear" | null>(null);
  const [seedNotice, setSeedNotice] = useState<{ tone: "ok" | "info"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [vista, setVista] = useState<Vista>("tutores");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRendimientoReport({
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      setReport(data);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar el reporte"));
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownload = useCallback(async (tipo: ReporteCsvTipo) => {
    setDownloading(tipo);
    setError(null);
    try {
      const { blob, filename } = await downloadReporteExcel(tipo, {
        desde: desde || undefined,
        hasta: hasta || undefined,
      });
      triggerBrowserDownload(blob, filename);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo descargar el reporte"));
    } finally {
      setDownloading(null);
    }
  }, [desde, hasta]);

  const buildSeedSummary = (result: DemoSeedResult): string =>
    `Datos demo listos: ${result.tutores_creados} tutores · ${result.estudiantes_creados} estudiantes · ${result.sesiones_totales} sesiones ` +
    `(${result.realizadas} realizadas, ${result.canceladas} canceladas, ${result.programadas} programadas) · ${result.evaluaciones_creadas} evaluaciones.`;

  const handleSeedDemo = useCallback(async () => {
    setSeeding("seed");
    setError(null);
    setSeedNotice(null);
    try {
      const result = await seedReporteDemo();
      setSeedNotice({ tone: "ok", text: buildSeedSummary(result) });
      await fetchReport();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron generar los datos de demostración"));
    } finally {
      setSeeding(null);
    }
  }, [fetchReport]);

  const handleClearDemo = useCallback(async () => {
    if (!window.confirm("¿Eliminar los usuarios y sesiones de demostración? Esta acción no se puede deshacer.")) {
      return;
    }
    setSeeding("clear");
    setError(null);
    setSeedNotice(null);
    try {
      const result = await clearReporteDemo();
      setSeedNotice({
        tone: "info",
        text: result.usuarios_eliminados === 0
          ? "No había datos de demostración para eliminar."
          : `Se eliminaron ${result.usuarios_eliminados} usuarios demo junto con sus sesiones y evaluaciones.`,
      });
      await fetchReport();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron eliminar los datos de demostración"));
    } finally {
      setSeeding(null);
    }
  }, [fetchReport]);

  const vistaActual = useMemo(() => VISTAS.find((v) => v.key === vista) ?? VISTAS[0], [vista]);

  const isDownloadDisabled = useMemo(() => {
    if (!report) return true;
    if (vista === "tutores")     return report.rendimiento_tutores.length === 0;
    if (vista === "estudiantes") return report.rendimiento_estudiantes.length === 0;
    return report.cancelaciones.length === 0;
  }, [report, vista]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0F2547]">Reportes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Mide la calidad de los tutores, el compromiso de los estudiantes y descarga la información que necesites.
          </p>
        </div>
        <button
          onClick={() => handleDownload(vistaActual.tipoCsv)}
          disabled={isDownloadDisabled || downloading !== null || loading}
          className="inline-flex items-center gap-2 px-4 py-[9px] rounded-[8px] bg-[#FFC100] text-[#0F2547] text-[13px] font-bold hover:bg-[#e6ad00] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {downloading === vistaActual.tipoCsv ? (
            <>
              <Download className="h-4 w-4 animate-pulse" />
              Generando...
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              Descargar Excel · {vistaActual.label.toLowerCase()}
            </>
          )}
        </button>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-8 w-8 rounded-[8px] bg-[#FFF3CC] text-[#B8860B] flex items-center justify-center flex-shrink-0">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#0F2547]">Datos de demostración</p>
            <p className="text-[11px] text-gray-500">
              Genera usuarios, sesiones, cancelaciones y evaluaciones de prueba para validar el comportamiento del reporte.
              Al regenerar, los datos demo anteriores se reemplazan.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleSeedDemo}
            disabled={seeding !== null || loading}
            className="inline-flex items-center gap-1.5 px-3 py-[8px] rounded-[7px] bg-[#0F2547] text-white text-[12px] font-semibold hover:bg-[#1a3a6b] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            {seeding === "seed" ? "Generando..." : "Cargar datos de prueba"}
          </button>
          <button
            onClick={handleClearDemo}
            disabled={seeding !== null || loading}
            className="inline-flex items-center gap-1.5 px-3 py-[8px] rounded-[7px] border border-[#D1D5DB] text-[12px] font-semibold text-[#374151] hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {seeding === "clear" ? "Eliminando..." : "Limpiar demo"}
          </button>
        </div>
      </div>

      {seedNotice && (
        <p
          className={cn(
            "text-[12px] rounded-[8px] px-3 py-2",
            seedNotice.tone === "ok"
              ? "bg-[#E6F4EA] text-[#1E7E34]"
              : "bg-[#E8F0FE] text-[#1A5EB8]"
          )}
        >
          {seedNotice.text}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px]">
        {[
          { label: "Sesiones totales", value: report?.resumen.total_sesiones ?? 0, color: "bg-gray-100 text-gray-700",     icon: Calendar },
          { label: "Realizadas",       value: report?.resumen.realizadas ?? 0,     color: "bg-[#E6F4EA] text-[#1E7E34]", icon: CheckCircle },
          { label: "Programadas",      value: report?.resumen.programadas ?? 0,    color: "bg-[#E8F0FE] text-[#1A5EB8]", icon: Clock },
          { label: "Canceladas",       value: report?.resumen.canceladas ?? 0,     color: "bg-red-50 text-red-600",      icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white border border-[#E5E7EB] rounded-[10px] p-3 flex items-center gap-3">
            <div className={cn("h-8 w-8 rounded-[8px] flex items-center justify-center flex-shrink-0", color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">{label}</p>
              <p className="text-lg font-bold text-[#0F2547]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3 flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-shrink-0">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="uppercase tracking-wide font-semibold">Rango de fechas</span>
        </div>
        <div className="flex flex-1 gap-3 w-full">
          <label className="flex-1 text-[11px] text-gray-500">
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              max={hasta || undefined}
              className="mt-1 w-full py-[7px] px-3 border border-[#E5E7EB] rounded-[7px] bg-[#F8FAFC] text-[12px] text-[#0F2547] focus:outline-none focus:border-[#FFC100]"
            />
          </label>
          <label className="flex-1 text-[11px] text-gray-500">
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              min={desde || undefined}
              className="mt-1 w-full py-[7px] px-3 border border-[#E5E7EB] rounded-[7px] bg-[#F8FAFC] text-[12px] text-[#0F2547] focus:outline-none focus:border-[#FFC100]"
            />
          </label>
        </div>
        {(desde || hasta) && (
          <button
            onClick={() => { setDesde(""); setHasta(""); }}
            className="text-[11px] text-gray-500 hover:text-[#0F2547] underline self-end sm:self-auto"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap">
        {VISTAS.map((v) => {
          const Icon = v.key === "tutores" ? User : v.key === "estudiantes" ? Users : TrendingDown;
          return (
            <button
              key={v.key}
              onClick={() => setVista(v.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors",
                vista === v.key ? "bg-[#0F2547] text-white" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 rounded-[8px] px-3 py-2">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-center text-gray-400 py-12">Cargando reporte...</p>
      ) : !report ? null : vista === "tutores" ? (
        <TutoresTable items={report.rendimiento_tutores} />
      ) : vista === "estudiantes" ? (
        <EstudiantesTable items={report.rendimiento_estudiantes} />
      ) : (
        <CancelacionesTable items={report.cancelaciones} />
      )}

      {!loading && report && vista === "tutores" && report.rendimiento_tutores.length > 0 && (
        <p className="text-[11px] text-gray-400 flex items-center gap-1">
          <Star className="h-3 w-3 text-[#FFC100] fill-[#FFC100]" />
          El % de 5★ corresponde a la proporción de calificaciones de 5 estrellas sobre el total de evaluaciones recibidas por el tutor.
        </p>
      )}
    </div>
  );
}
