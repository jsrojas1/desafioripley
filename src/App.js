import React, { Component } from "react";
import io from 'socket.io-client';
import socketIOClient from "socket.io-client";


class Weather extends Component {
  constructor() {
    super();
    this.state = {
      response: false,
      endpoint: "https://desafioripley.herokuapp.com:8080",
      city: '',
      timezone: '',
      time: '',
      temp: ''
    };
  }

  componentDidMount() {
    //const { endpoint } = this.state;
    //const socket = socketIOClient(endpoint);
    const socket = io();
    socket.on('hello', ({message}) =>
         console.log(message)
    );
    socket.on("FromAPI", data => this.setState({ response: true, timezone: data.timezone, time: new Date(data.time*1000).toLocaleString("en-US", {timeZone: data.timezone}), temp: data.temp }));
    socket.emit('setCityName', this.props.value);
    
  }
  render() {
    const { response } = this.state;
    return (
      <div style={{ textAlign: "center" }}>
        {response
          ? 
            <div>
            <p>
              La temperatura actual en {this.props.value} es: {this.state.temp} °C
            </p>
            <p>
              Hora Local: {this.state.time}
            </p>
            <p>
              ---------------------------------------
            </p>
            </div>
          : <p>Obteniendo datos de {this.props.value}  ...</p>}
      </div>
    );
  }

}


class App extends Component {
  renderWeather(name) {
    return (
        <Weather
           value={name}
        />
    );
}
  render() {
    return (
      <div className="App">
        {this.renderWeather('Santiago')}
        {this.renderWeather('Zurich')}
        {this.renderWeather('Auckland')}
        {this.renderWeather('Sydney')}
        {this.renderWeather('London')}
        {this.renderWeather('Georgia')}
      </div>
    );
  }
  
}
export default App;