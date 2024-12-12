import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatHour = (hour) => {
    const ampm = hour < 12 ? "AM" : "PM";
    const formattedHour = hour % 12 || 12; // Convierte 0 (medianoche) a 12 y mantiene el resto en formato 12h
    return `${formattedHour} ${ampm}`;
  };
const CanchaHorariosChart = ({ cancha }) => {

      

    const dias = Object.keys(cancha.horarios);
    const horasGrabacion = dias.map((dia) => {
        const inicio = parseInt(cancha.horarios[dia].inicio.split(":")[0]); // Ejemplo: "6:00 AM" -> 6
        const fin = parseInt(cancha.horarios[dia].fin.split(":")[0]); // Ejemplo: "6:00 PM" -> 18
        return { dia, inicio, fin };
      });
      const data = {
        labels: dias,
        datasets: [
          {
            label: `Hora de inicio`,
            data: horasGrabacion.map((item) => item.inicio), // Horas de inicio
            backgroundColor: "rgba(75, 192, 192, 0.6)", // Color azul
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
          {
            label: `Hora de finalización`,
            data: horasGrabacion.map((item) => item.fin), // Horas de finalización
            backgroundColor: "rgba(255, 99, 132, 0.6)", // Color rojo
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
          },
        ],
      };
    
      const options = {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "#fdfdff", // Cambia el color de los textos de la leyenda
            },
          },
          
          title: {
            display: true,
            text: `Horas de Grabación (${cancha.nombre})`,
            color:"#ff9e01",
            font: {
                size: 15, // Tamaño de fuente
                weight: "bold", // Peso de la fuente
              },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw; // Valor bruto de la barra
                const datasetLabel = context.dataset.label; // Nombre del dataset (Hora Inicio o Hora Final)
                return `${datasetLabel}: ${formatHour(value)}`; // Formatea el texto del tooltip
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 24,
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return formatHour(value); // Formatea las etiquetas del eje Y
              },
              color:"#fff",

            },
            grid: {
                color: "rgba(255, 255, 255, 0.041)", // Cambia el color de las líneas de cuadrícula del eje Y
                borderColor: "#1E3A8A", // Cambia el color de la línea del eje Y
              },
            title: {
              display: true,
              text: "Horas",
              color:"#ff9e01",
              font:{
                size:14
              },
            },
          },
          x: {
            ticks: {
              autoSkip: false,
              color: "#ffffff",
            },
            grid: {
                color: "rgba(255, 255, 255, 0.116)", // Cambia el color de las líneas de cuadrícula del eje X
                borderColor: "#1E3A8A", // Cambia el color de la línea del eje X
              },
          },
        },
      };
      
  

  return (
    <div style={{ width: "100%", margin: "0 auto" }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default CanchaHorariosChart;
