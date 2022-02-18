import express from "express";
import {Server} from "socket.io";
import {instrument } from "@socket.io/admin-ui";
import http from "http";


const app = express();

app.set('view engine', "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));


const httpServer = http.createServer(app); //http를 원하는 이유는 views, static files, home, redirection을 원하기 때문
const wsServer = new Server(httpServer, {
    cors: {
      origin: ["https://admin.socket.io"],
      credentials: true
    }
  });

instrument(wsServer, {
    auth: false,
});

function publicRooms(){
    const {
        sockets: {
            adapter: {sids, rooms},
        },
    } = wsServer;
   const publicRooms = [];
   rooms.forEach((_,key) => {
       if(sids.get(key) === undefined){
           publicRooms.push(key)
       }
   })
   return publicRooms;
}


function countRoom(roomName){
  return   wsServer.sockets.adapter.rooms.get(roomName)?.size;
}


wsServer.on("connection", (socket) => {
    // if(socket["nickname"] = "") {
    //     alert("please write nickname");    
    // }else{
    //   socket.on("nickname", nickname => (socket["nickname"] = nickname));
    // }
    socket["nickname"] = "Anon";
    socket.onAny((event) => {
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
    })
    socket.onAny((event) => {
        console.log(`Socket Event:${event}`);
    });
    
    socket.on("enter_room", (roomName, done ) => {
       socket.join(roomName);
       done();
       socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
       wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => 
            socket.to(room).emit("bye", socket.nickname, countRoom(room) -1)
      );
    });

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("new_message", (msg, room, done) => {
         socket.to(room).emit("new_message",`${socket.nickname}: ${msg}`);
         done();
    });
     
   
});





// const wss = new WebSocket.Server({ server });
//http와 wss를 둘다 사용하기 위해 이렇게 작성함. 필수적인 요소는 아님. 이번에 이렇게 배울려고 하는거임.


// function onSocketClose() {
//     console.log("Disconnected from the Browser ❌");
//   }
  
//   const sockets = [];

//   wss.on("connection", (socket) => {
//     sockets.push(socket);
//     socket["nickname"] = "Anon";
//     console.log("Connected to Browser ✅");
//     socket.on("close", onSocketClose);
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg);
//         switch(message.type){
//             case "new_message":
//             sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`));
//             case "nickname":
//             socket["nickname"] = message.payload; //닉네임을 정한 소켓에서 이 부분이 실행됨.
//         }
//     });
// });



const handleListen = () => console.log('Listening on http://localhost:3000');

httpServer.listen(3000, handleListen);

// { 
//     type:"message",
//     payload:"hello everyone!"
// }

// app.listen(3000, handleListen);