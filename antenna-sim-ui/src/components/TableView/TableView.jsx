import { useMemo, useState } from "react";
import ConvertToXmlButton from "../ConvertToXmlButton";
import { DEFAULT_ACTIVE } from "./constants";
import { parseTextToTable } from "./utils/parseTextToTable";
import { pickHeadersByPreference } from "./utils/columnUtils";
import useTableColumns from "./hooks/useTableColumns";
import TableToolbar from "./components/TableToolbar";
import TableColumnsPanel from "./components/TableColumnsPanel";
import TableGrid from "./components/TableGrid";

export default function TableView({ title = "Table", text = "", maxHeight = 520, scanId = null }) {
  const parsed = useMemo(() => parseTextToTable(text), [text]);
  const allHeaders = parsed.headers;
  const rows = parsed.rows;

  const defaultSelected = useMemo(() => {
    if (!allHeaders.length) return [];
    return pickHeadersByPreference(allHeaders, DEFAULT_ACTIVE);
  }, [allHeaders]);

  const table = useTableColumns(allHeaders, defaultSelected);
  const [selectedRowIndexes, setSelectedRowIndexes] = useState(() => new Set());
  const hasData = Boolean(allHeaders.length) && Boolean(rows.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
      <TableToolbar
        title={title}
        hasData={hasData}
        rowsCount={rows.length}
        headersCount={allHeaders.length}
        allHeaders={allHeaders}
        resetToDefault={table.resetToDefault}
        showColumnsView={table.showColumnsView}
        setShowColumnsView={table.setShowColumnsView}
        showAll={table.showAll}
        hideAll={table.hideAll}
      >
        <ConvertToXmlButton
          headers={allHeaders}
          rows={rows}
          scanId={scanId}
          selectedRows={selectedRowIndexes}
        />
      </TableToolbar>

      <TableColumnsPanel
        allHeaders={allHeaders}
        showColumnsView={table.showColumnsView}
        colSearch={table.colSearch}
        setColSearch={table.setColSearch}
        visibleHeaders={table.visibleHeaders}
        filteredAvailable={table.filteredAvailable}
        selected={table.selected}
        toggleHeader={table.toggleHeader}
        move={table.move}
      />

      <TableGrid
        hasData={hasData}
        visibleHeaders={table.visibleHeaders}
        rows={rows}
        colIndexByHeader={table.colIndexByHeader}
        selectedRows={selectedRowIndexes}
        onSelectedRowsChange={setSelectedRowIndexes}
        maxHeight={maxHeight}
      />
    </div>
  );
}