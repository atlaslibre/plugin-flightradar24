import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { executeQuery } from "./features/db-interface";

const Options = () => {
  const [positionCounts, setPositionCounts] = useState(-1);
  const [dataCounts, setDataCounts] = useState(-1);

  const updateCounts = () => {
    executeQuery<any[]>("SELECT COUNT(*) as c FROM aircraft_positions").then(
      (result) => setDataCounts(result[0].c)
    );

    executeQuery<any[]>("SELECT COUNT(*) as c FROM aircraft_data").then(
      (result) => setPositionCounts(result[0].c)
    );
  };

  const clearDb = () => {
    executeQuery<any[]>("DELETE FROM aircraft_positions").then(() =>
      executeQuery<any[]>("DELETE FROM aircraft_data").then(() => {
        updateCounts();
      })
    );
  };

  useEffect(() => updateCounts());

  return (
    <>
      <dl>
        <dt>Known aircraft positions</dt>
        <dd>{positionCounts}</dd>

        <dt>Known aircraft data updates</dt>
        <dd>{dataCounts}</dd>
      </dl>
      <button onClick={updateCounts}>Update</button> <button onClick={clearDb}>Clear DB</button>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
