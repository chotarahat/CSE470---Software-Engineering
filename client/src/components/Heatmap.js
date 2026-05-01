import React, { useEffect, useState } from "react";
import axios from "axios";
import "./heatmap.css";

const Heatmap = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("/api/tickets/heatmap")
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  const getColor = (count) => {
    if (count > 20) return "#ff4d4d";
    if (count > 10) return "#ffa64d";
    if (count > 5) return "#ffd24d";
    if (count > 0) return "#d2f8d2";
    return "#f0f0f0";
  };

  const grid = [];

  for (let day = 1; day <= 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const cell = data.find(d => d.day === day && d.hour === hour);
      const count = cell ? cell.count : 0;

      grid.push(
        <div
          key={`${day}-${hour}`}
          className="cell"
          style={{ backgroundColor: getColor(count) }}
          title={`Day ${day}, Hour ${hour}: ${count}`}
        />
      );
    }
  }

  return <div className="heatmap">{grid}</div>;
};

export default Heatmap;