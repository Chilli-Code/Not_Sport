"use client";
import React, { useState } from "react";
import moment from "moment";
import { useUser } from "./admin/UserContext";


const ChatContainer = () => {
  const { username } = useUser();

  const avatars = [
    "/assets/avatar1.jpeg",
    "/assets/avatar2.jpeg",
    "/assets/avatar3.avif",
    "/assets/avatar4.avif",
    "/assets/avatar5.avif",
  ];

  const [messages, setMessages] = useState([
    {
      image: avatars[0],
      message: "Hi I want to withdraw everything..! This is awesome",
      time: `${Date.now()}`,
      isSender: true,
    },
    {
      image: avatars[1],
      message: "Hey guys...How you all doing...It's been so long",
      time: `${Date.now()}`,
      isSender: false,
    },
  ]);

  const [value, setValue] = useState("");

  const sendMessage = () => {
    if (value.trim()) {
      setMessages([
        ...messages,
        { image: avatars[0], message: value, time: `${Date.now()}`, isSender: true },
      ]);
      setValue("");
    }
  };

  return (
    <div className="fixed top-[100px] w-[380px] max-w-lg bg-[#222222] shadow-lg h-[calc(100vh-120px)] rounded-[50px] overflow-hidden flex flex-col">
      {/* Top */}
      <div className="w-full px-4 bg-[#2B2B2B] flex items-center justify-between">
        <div className="w-full flex items-start justify-start flex-col gap-2 px-3">
          {/* Title */}

        <div className="w-full px-4 py-3 flex items-center justify-between">
        <h2 className="text-textSecondary font-bold text-lg flex items-center gap-2">
          <i className="bx bx-chat text-2xl text-heroSecondary"></i> GENERAL CHAT
        </h2>
        <div className="text-sm text-textSecondary">
          Online: <span className="font-bold text-heroSecondary">177</span>
        </div>
      </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-scroll w-full px-4 py-2  scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 ">
        {messages &&
          messages.map((msg, index) => (
            <React.Fragment key={index}>
              {msg.isSender ? (
                <Sender msg={msg} username={username} />
              ) : (
                <Reciever msg={msg} username={username} />
              )}
            </React.Fragment>
          ))}
      </div>

      {/* Bottom */}
      <div className="w-full gap-2 h-20 bg-[#2B2B2B] px-6 py-2 flex items-center justify-center">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Send a message ..."
          className="flex-1 outline-none border-none bg-transparent text-[#9d9d9d] placeholder:text-[#5d5d5d]"
        />
        <div className="w-[1px] h-6 bg-third"></div>
        <i
          onClick={sendMessage}
          className="bx bxs-paper-plane text-2xl text-heroSecondary  cursor-pointer"
        />
      </div>
    </div>
  );
};

export const Reciever = ({ msg,username }) => {
  return (
    <div className="w-full bg-secondary p-3 rounded-lg shadow-md mb-4">
      <div className="flex items-center justify-start gap-2">
        <img
          src={msg?.image}
          className="w-12 h-12 rounded-full object-cover"
          alt=""
        />
        <div className="flex gap-1 flex-col overflow-hidden">
          <p className="text-heroSecondary font-bold ">{username}</p>
        <p className="text-sm text-zinc-300 flex-1 text-left break-words">{msg?.message}</p>
        </div>
        <i className="BsThreeDots text-2xl text-zinc-300" />
      </div>
      <div className="flex items-center justify-end px-4">
        <p className="text-sm text-zinc-500">
          {moment(new Date(parseInt(msg?.time)).toISOString()).fromNow()}
        </p>
      </div>
    </div>
  );
};

export const Sender = ({ msg,username }) => {
  return (
    <div className="w-full bg-gradient-to-b bg-secondary px-2 py-3 rounded-lg shadow-md mb-4">
      <div className="flex items-start justify-start gap-2">
        <img
          src={msg?.image}
          className="w-12 h-12 rounded-full object-cover"
          alt=""
        />
        <div className="flex gap-1 flex-col overflow-hidden">
          <p className="text-heroSecondary font-bold ">{username}</p>
        <p className="text-sm text-zinc-300 flex-1 text-left break-words">{msg?.message}</p>
        </div>
        <i className="BsThreeDots text-2xl text-zinc-300" />
      </div>
      <div className="flex items-center justify-end px-4">
        <p className="text-sm text-zinc-500">
          {moment(new Date(parseInt(msg?.time)).toISOString()).fromNow()}
        </p>
      </div>
    </div>
  );
};

export default ChatContainer;
