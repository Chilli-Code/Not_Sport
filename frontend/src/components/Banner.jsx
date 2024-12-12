"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Image from "next/image";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";



const Banner = () => {
  const slides = [
    { image: "/assets/ss.webp", text: "Disfruta de tus partidos \n descargados en HD", highlight: ["HD","descargados","D"] },
    { image: "/assets/4.jpg", text: "La mejor experiencia \n en futbolística", highlight: ["futbolística","L"] },
    { image: "/assets/3.png", text: "Capturamos tus mejores \n jugadas", highlight: ["jugadas","mejores","C"] },
    { image: "/assets/5.jpg", text: "Creacion de Resumenes \n de tus partidos 🎥", highlight: ["Resumenes", "partidos","C"] },
    { image: "/assets/7.jpg", text: "Recuerda tus momentos \n de gloria ", highlight: ["gloria","momentos","R"] },
  ];


  return (
    <div className="w-full  rounded-[40px] h-64 xl:h-96 bg-fourth overflow-hidden relative shadow-lg shadow-[rgba(0,0,0,0.6)]">
      {/* slider */}
      <Swiper
        spaceBetween={30}
        centeredSlides={false}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        modules={[Autoplay]}
        className="mySwiper"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <Slide image={slide.image} text={slide.text} highlights={slide.highlight} />
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="absolute inset-0 flex items-end justify-end z-50">
        <div className="w-full h-auto px-8 py-4 backdrop-blur-md bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.9)]  relative  flex items-center justify-start gap-6 flex-wrap">
          {/*  */}
          <div className="flex items-center justify-center gap-2 group">
            <div className="w-6 rounded-md h-6 bg-textS bg-secondary  group-hover:bg-secondary flex items-center justify-center">
              <i className=" bx bx-paper-plane text-heroSecondary " />
            </div>
            <p className="text-textSecondary text-sm group-hover:text-heroSecondary">
              Luck Numbers
            </p>
          </div>

          {/*  */}
          <div className="flex items-center justify-center gap-2 group">
            <div className="w-6 rounded-md h-6 bg-secondary  group-hover:bg-secondary flex items-center justify-center">
              <i className=" bx bx-football text-heroSecondary " />
            </div>
            <p className="text-textSecondary text-sm group-hover:text-heroSecondary">
              Soccer
            </p>
          </div>

          {/*  */}
          <div className="flex items-center justify-center gap-2 group">
            <div className="w-6 rounded-md h-6 bg-secondary group-hover:bg-secondary flex items-center justify-center">
              <i className="bx bx-award text-heroSecondary " />
            </div>
            <p className="text-textSecondary text-sm group-hover:text-heroSecondary">
              Jacpot
            </p>
          </div>

          {/*  */}
          <div className="flex items-center justify-center gap-2 group">
            <div className="w-6 rounded-md h-6 bg-secondary  group-hover:bg-secondary flex items-center justify-center">
              <i className="bx bx-bar-chart text-heroSecondary " />
            </div>
            <p className="text-textSecondary text-sm group-hover:text-heroSecondary">
              Bet Games
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


export const Slide = ({ image, text, highlights }) => {
  const highlightWords = (line, words = []) => {
    if (!Array.isArray(words)) words = [words]; // Asegurar que `words` es un array.
    const regex = new RegExp(`(${words.join("|")})`, "gi"); // Generar expresión regular dinámica.
    const parts = line.split(regex); // Dividir el texto usando la expresión regular.

    return parts.map((part, index) =>
      words.some((word) => word.toLowerCase() === part.toLowerCase()) ? (
        <span key={index} className="text-yellow-500 font-bold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };
  const lines = text.split("\n"); // Divide el texto en líneas usando `\n`.

  return (
    <div className="w-full h-full relative">
      <Image
        src={image}
        width={823}
        height={200}
        loading="lazy"
        className="w-full h-full object-cover"
        alt="Slide"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,0,0,0.6)] to-transparent">
        <div className="w-full h-full flex flex-col items-start justify-start px-4 py-2 lg:px-8 lg:py-6">
          {lines.map((line, index) => (
            <h1
              key={index}
              className="text-xl lg:text-3xl mb-3 font-bold text-white tracking-wide"
              style={{ textShadow: "5px 5px 8px rgba(0,0,0,0.6)" }}
            >
              {highlightWords(line, highlights)}
            </h1>
          ))}
        </div>
      </div>
    </div>
  );
};


export default Banner;
