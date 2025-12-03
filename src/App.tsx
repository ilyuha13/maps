import { useState } from "react";
import { AddressAutocomplete } from "./components/AddressAutocomplete";
import { MapComponent } from "./components/MapComponents/MapComponents";
import type { Coordinates } from "./types";
import css from "./App.module.css";

function App() {
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinates>();
  const [onHandleCheckClick, setOnHandleCheckClick] = useState(false);
  return (
    <div className={css.container}>
      <div className={css.controls}>
        <AddressAutocomplete
          onAddressSelect={(data) => {
            setSelectedCoordinate(data.coordinates);
          }}
        />
        <button
          className={css.checkButton}
          onClick={() => setOnHandleCheckClick((prev) => !prev)}
        >
          Проверить попадание в полигон
        </button>
      </div>

      <MapComponent
        handleCheck={onHandleCheckClick}
        coordinate={selectedCoordinate}
      />
    </div>
  );
}

export default App;
