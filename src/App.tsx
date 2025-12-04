import { useCallback, useState } from "react";
import { MapComponent } from "./components/MapComponents/MapComponents";
import type { Coordinates } from "./types";
import css from "./App.module.css";
import { useToast } from "./hooks/useToast";
import { AddressAutocomplete } from "./components/AddressAutocomplete/AddressAutocomplete";

function App() {
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinates>();
  const [triggerCheck, setTriggerCheck] = useState(false);
  const toast = useToast();

  const handleCheckResult = useCallback(
    (result: boolean | null) => {
      if (result === null) {
        toast.error("Нет полигона или координат");
      } else if (result) {
        toast.success("Точка внутри полигона");
      } else {
        toast.error("Точка вне полигона");
      }
    },
    [toast]
  );
  return (
    <div className={css.container}>
      <div className={css.controls}>
        <AddressAutocomplete
          onAddressSelect={(data) => {
            setSelectedCoordinate(data?.coordinates);
          }}
        />
        <button
          className={css.checkButton}
          onClick={() => setTriggerCheck(!triggerCheck)}
        >
          Проверить попадание в полигон
        </button>
      </div>

      <MapComponent
        trigerCheck={triggerCheck}
        onCheckResult={handleCheckResult}
        coordinate={selectedCoordinate}
      />
    </div>
  );
}

export default App;
