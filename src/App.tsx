import { useState, useEffect, useRef, useMemo } from "react";
import { useGeolocated } from "react-geolocated";
import './App.css'
import { qiblahval, setDefaultValues } from "./util/scriptUtil";
import { ApolloError, gql, useApolloClient } from "@apollo/client";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

const GET_SOLAR_POSITION = gql`
  query SolarPosition(
    $lat: DMSInput!
    $lon: DMSInput!
    $dateTime: String!
  ) {
    solarPosition(
      lat: $lat
      lon: $lon
      dateTime: $dateTime
    ) {
      solarDeclination
      hourAngle
      solarElevation
      solarAzimuth
      shadowAzimuth
      sunAzimuthDifference
      shadowAzimuthDifference
      observationLocation {
        latitude
        longitude
      }
      observationTime {
        localTime
        utcTime
        timezoneOffset
      }
    }
  }
`;

function App() {
  const client = useApolloClient();
  const [qiblahVal, setQiblahVal] = useState<qiblahval>({
    latdeg: 0,
    latdir: "",
    latmin: 0,
    latsec: 0,
    longdeg: 0,
    longdir: "",
    longmin: 0,
    longsec: 0,
    obsDate: new Date(),
    obstime: new Date()
  })

  const [resultVal, setResultVal] = useState<{
    solarAzimuth: number,
    shadowAzimuth: number
  } | null>(null)

  const {
    coords,
    isGeolocationAvailable,
    isGeolocationEnabled
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: false
    },
    userDecisionTimeout: 5000
  });

  const handle = useFullScreenHandle();

  const timeInternal = useRef<any>(null)
  const [timeValid, setTimeValid] = useState(0)
  const formatTime = useMemo(() => {
    if (timeValid == 0) {
      clearInterval(timeInternal.current)
      return ""
    }
    const hrs = Math.floor(timeValid / 3600);
    const mins = Math.floor((timeValid % 3600) / 60);
    const secs = timeValid % 60;

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [timeValid])

  function changeQiblahVal(key: keyof qiblahval, value: string | number | Date) {
    setQiblahVal(el => {
      let newEl: qiblahval = structuredClone(el)

      newEl = { ...newEl, [key]: value }

      return newEl
    })
  }

  useEffect(() => {
    setDefaultValues((dat) => {
      setQiblahVal(dat)
    })
  }, [coords, isGeolocationAvailable, isGeolocationEnabled]);





  async function submitData() {
    try {
      const newobsDate = qiblahVal.obsDate.toISOString().split("T")[0]
      const newobstime = qiblahVal.obstime.toTimeString().split(' ')[0].slice(0, 5)

      const observationDateTime = new Date(`${newobsDate}T${newobstime}:00`);
      const formattedDate = observationDateTime.getUTCFullYear() + '-' +
        String(observationDateTime.getUTCMonth() + 1).padStart(2, '0') + '-' +
        String(observationDateTime.getUTCDate()).padStart(2, '0') + ' ' +
        String(observationDateTime.getUTCHours()).padStart(2, '0') + ':' +
        String(observationDateTime.getUTCMinutes()).padStart(2, '0') + ':' +
        String(observationDateTime.getUTCSeconds()).padStart(2, '0');
      const result = await client.query({
        query: GET_SOLAR_POSITION,
        variables: {
          lat: {
            degrees: qiblahVal.latdeg,
            minutes: qiblahVal.latmin,
            seconds: qiblahVal.latsec,
            direction: qiblahVal.latdir
          },
          lon: {
            degrees: qiblahVal.longdeg,
            minutes: qiblahVal.longmin,
            seconds: qiblahVal.longsec,
            direction: qiblahVal.longdir
          },
          dateTime: formattedDate
        }
      })
      console.log(result)
      const data = result.data
      console.log(data.solarPosition)
      setResultVal(data.solarPosition)
    } catch (err) {
      console.error(err)
      if (err instanceof ApolloError) {
        console.log(err.cause)
        alert(err.message)
        return
      }
      alert("Terjadi Masalah")
    }
    // setTimeValid(data.durationMinutes * 60)
    // clearInterval(timeInternal.current)
    // timeInternal.current = setInterval(() => {
    //   setTimeValid(el => el - 1)
    // }, 1000)

  }

  return (
    <div className="App">
      {resultVal == null ? (
        <div className="form-container">
          <div className="header">
            <h1>Ilmu Falak Calculator</h1>
            <p>Calculate solar position and Qibla direction</p>
          </div>
          
          <div className="form-content">
            <div className="form-grid">
              <div className="form-section">
                <h3>📍 Latitude</h3>
                <div className="coordinate-grid">
                  <div className="input-group">
                    <label htmlFor="">Degrees</label>
                    <input 
                      type="number" 
                      value={qiblahVal.latdeg} 
                      onChange={(el) => changeQiblahVal("latdeg", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="">Minutes</label>
                    <input 
                      type="number" 
                      value={qiblahVal.latmin} 
                      onChange={(el) => changeQiblahVal("latmin", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="">Seconds</label>
                    <input 
                      type="number" 
                      value={qiblahVal.latsec} 
                      onChange={(el) => changeQiblahVal("latsec", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="">Direction</label>
                    <select 
                      value={qiblahVal.latdir} 
                      onChange={(el) => changeQiblahVal("latdir", el.target.value)}
                    >
                      <option value="W">West</option>
                      <option value="N">North</option>
                      <option value="S">South</option>
                      <option value="E">East</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>🌐 Longitude</h3>
                <div className="coordinate-grid">
                  <div className="input-group">
                    <label htmlFor="">Degrees</label>
                    <input 
                      type="number" 
                      value={qiblahVal.longdeg} 
                      onChange={(el) => changeQiblahVal("longdeg", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="">Minutes</label>
                    <input 
                      type="number" 
                      value={qiblahVal.longmin} 
                      onChange={(el) => changeQiblahVal("longmin", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="">Seconds</label>
                    <input 
                      type="number" 
                      value={qiblahVal.longsec} 
                      onChange={(el) => changeQiblahVal("longsec", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="">Direction</label>
                    <select 
                      value={qiblahVal.longdir} 
                      onChange={(el) => changeQiblahVal("longdir", el.target.value)}
                    >
                      <option value="W">West</option>
                      <option value="N">North</option>
                      <option value="S">South</option>
                      <option value="E">East</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section datetime-section">
                <h3>⏰ Date & Time</h3>
                <div className="datetime-grid">
                  <div className="input-group">
                    <label htmlFor="">Date</label>
                    <input 
                      type="date" 
                      value={qiblahVal.obsDate.toISOString().split("T")[0]} 
                      onChange={(ev) => {
                        const date = new Date(ev.target.value)
                        changeQiblahVal("obsDate", date)
                      }} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="">Time</label>
                    <input 
                      type="time" 
                      value={qiblahVal.obstime.toTimeString().split(' ')[0].slice(0, 5)} 
                      onChange={(ev) => {
                        const date = new Date()
                        const [hour, minutes] = ev.target.value.split(":")
                        date.setHours(parseInt(hour))
                        date.setMinutes(parseInt(minutes))
                        changeQiblahVal("obstime", date)
                      }} 
                    />
                  </div>
                </div>
              </div>

              <div className="submit-section">
                <button className="btn-primary" onClick={submitData}>
                  Calculate Position
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="results-container">
          <div className="compass-section">
            <div className="compass-container">
              <div className="compass">
                <div 
                  className="compass-needle solar-needle"
                  style={{
                    transform: `translateX(-50%) rotate(${resultVal.solarAzimuth}deg)`
                  }}
                />
                <div 
                  className="compass-needle shadow-needle"
                  style={{
                    transform: `translateX(-50%) rotate(${resultVal.shadowAzimuth}deg)`
                  }}
                />
                <div className="compass-center" />
              </div>
            </div>

            <div className="legend">
              <div className="legend-item">
                <div className="legend-color legend-solar"></div>
                <span>Solar Direction</span>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-shadow"></div>
                <span>Shadow Direction</span>
              </div>
            </div>
          </div>

          <div className="results-grid">
            <div className="result-card">
              <h4>Qibla Direction</h4>
              <p className="result-value solar-value">
                {resultVal.solarAzimuth.toFixed(2)}°
              </p>
            </div>
            <div className="result-card">
              <h4>Shadow Direction</h4>
              <p className="result-value shadow-value">
                {resultVal.shadowAzimuth.toFixed(2)}°
              </p>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => setResultVal(null)}>
              ← Back to Form
            </button>
            <button className="btn-primary" onClick={() => handle.enter()}>
              Fullscreen View
            </button>
          </div>

          <FullScreen handle={handle}>
            <div className="fullscreen-compass" style={{ display: handle.active ? "flex" : "none" }}>
              <div className="compass-container">
                <div className="compass">
                  <div 
                    className="compass-needle solar-needle"
                    style={{
                      transform: `translateX(-50%) rotate(${resultVal.solarAzimuth}deg)`
                    }}
                  />
                  <div 
                    className="compass-needle shadow-needle"
                    style={{
                      transform: `translateX(-50%) rotate(${resultVal.shadowAzimuth}deg)`
                    }}
                  />
                  <div className="compass-center" />
                </div>
              </div>
              
              <div className="legend">
                <div className="legend-item">
                  <div className="legend-color legend-solar"></div>
                  <span>Solar Direction: {resultVal.solarAzimuth.toFixed(2)}°</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color legend-shadow"></div>
                  <span>Shadow Direction: {resultVal.shadowAzimuth.toFixed(2)}°</span>
                </div>
              </div>
              
              <button className="close-button" onClick={() => handle.exit()} />
            </div>
          </FullScreen>
        </div>
      )}
    </div>
  );
}

export default App
