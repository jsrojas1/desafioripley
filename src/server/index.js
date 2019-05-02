var coords = {
    Santiago: {lat: -33.4378, long: -70.6504},
    Zurich: {lat: 47.3769, long: 8.5414},
    Auckland: {lat: -36.8485, long: 174.7633},
    Sydney: {lat: -33.8548, long: 151.2165},
    London: {lat: 51.5074, long: 0.1278},
    Georgia: {lat: 32.1656, long: -83.1137}
}
const apiKey = "1888117cdd65e6f3d020d407a9dbc9bf";

const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 8080;
const axios = require("axios");

app.use(express.static(path.join(__dirname, '../../build')));

app.get('/', (req,res,next) =>
    res.sendFile(__dirname + './index.html')
);

let interval;

io.on('connection', socket => {
    socket.emit('hello', {message: 'hello from server'})
    if (interval) {
        clearInterval(interval);
      }
    socket.on('setCityName', (city) => {
        console.log('client is subscribing to weather with city ', city);
        interval +=  setInterval(() => {
        PrepareApiCall(socket, city)
      }, 10000);
      });
      socket.on('disconnect', function () {
        console.log("client is disconnecting and interval clearing");
        clearInterval(interval);
    });
});

server.listen(port);

const PrepareApiCall = async (socket, city) => {
    try {
  
      //Consultar en redis por las coordenadas de la ciudad y hacer llamado a la api
      await redisclient.hgetall(city, function(err,reply) {
          console.log(err);
          console.log(reply);
          console.log(reply.lat);
          lat = reply.lat;
          long = reply.long.toString();
          console.log("lat es: " + lat);
          console.log("long es: " + long);
  
          url = "https://api.darksky.net/forecast/"+apiKey+"/"+lat.toString()+","+long.toString()+"?exclude=minutely+hourly+daily+alerts+flags&units=si";
  
          CallApiAndEmit(url, socket);
          
      });
      
    } catch (error) {
      console.error(`Error: ${error.code}`);
    }
  };

  async function CallApiAndEmit (url, socket){

    try{
        //Simular fallo en la API
        if (Math.random(0, 1) < 0.1) throw new Error('How unfortunate! The API Request Failed');

        console.log("url de consulta es: " + url);
        const res = await axios.get(
            url
        );
        socket.emit("FromAPI", {timezone: res.data.timezone, temp: res.data.currently.temperature, time: res.data.currently.time});

    } catch(error){
        redisclient.hmset('api.errors', Date.now(), error.toString(), (err, reply) => {
            if(err) {
              console.error(err);
            } else {
              console.log(reply);
            }
          });

    }
    
}

//Redis
var redis = require('redis');
var redisclient = redis.createClient(process.env.REDIS_URL); 

//Guardar las coordenadas en Redis al iniciar
redisclient.on('connect', function() {
    console.log('Redis client connected');

    StoreCoords("Santiago");
    StoreCoords("Zurich");
    StoreCoords("Auckland");
    StoreCoords("Sydney");
    StoreCoords("London");
    StoreCoords("Georgia");
});

redisclient.on('error', function (err) {
    console.log('Something went wrong ' + err);
})

function StoreCoords(key){

    redisclient.exists(key,function(err,reply) {
        if(!err) {
         if(reply === 1) {
          console.log("Key exists");
        
         } else {

            console.log(coords[key]);
            redisclient.hmset(key, "lat", coords[key].lat, "long", coords[key].long, redis.print);
         }
        }
    });


}