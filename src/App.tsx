import { useState, useEffect, useRef, useMemo } from "react";
import { useGeolocated } from "react-geolocated";
import './App.css'
import { performCalculation, qiblahval, setDefaultValues } from "./util/scriptUtil";
import { ApolloError, gql, useApolloClient } from "@apollo/client";
import { dir } from "console";
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
      distanceToKaaba
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
      <div style={{
        display :resultVal == null ? 'block' : 'none'
      }}>
        <div>
          {/* <img src="/icon.jpg" alt="" /> */}
          {/* <h2>Universitas Muhammadiyah Makassar</h2> */}
        </div>
        <div>
          <div>
            <label>Latitude</label>
            <div>
              <div>
                <label htmlFor="">Derajat</label>
                <p >:</p>
                <input id="" type="number" value={qiblahVal.latdeg} onChange={(el) => {
                  changeQiblahVal("latdeg", el.target.value)
                }} />

              </div>
              <div>
                <label htmlFor="">Menit</label>
                <p >:</p>
                <input id="" type="number" value={qiblahVal.latmin} onChange={(el) => {
                  changeQiblahVal("latmin", el.target.value)
                }} />
              </div>
              <div>
                <label htmlFor="">Detik</label>
                <p>:</p>
                <input id="" type="number" value={qiblahVal.latsec} onChange={(el) => {
                  changeQiblahVal("latsec", el.target.value)
                }} />
              </div>
              <div>
                <label htmlFor="">Arah</label>
                <p>:</p>
                <select name="" id="" value={qiblahVal.latdir} onChange={(el) => {
                  changeQiblahVal("latdir", el.target.value)
                }}>
                  <option value="W">Barat</option>
                  <option value="N">Utara</option>
                  <option value="S">Selatan</option>
                  <option value="E">Timur</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label>Longitude</label>
            <div>
              <div>
                <label htmlFor="">Derajat</label>
                <p >:</p>
                <input id="" type="number" value={qiblahVal.longdeg} onChange={(el) => {
                  changeQiblahVal("longdeg", el.target.value)
                }} />

              </div>
              <div>
                <label htmlFor="">Menit</label>
                <p >:</p>
                <input id="" type="number" value={qiblahVal.longmin} onChange={(el) => {
                  changeQiblahVal("longmin", el.target.value)
                }} />
              </div>
              <div>
                <label htmlFor="">Detik</label>
                <p>:</p>
                <input id="" type="number" value={qiblahVal.longsec} onChange={(el) => {
                  changeQiblahVal("longsec", el.target.value)
                }} />
              </div>
              <div>
                <label htmlFor="">Arah</label>
                <p>:</p>
                <select name="" id="" value={qiblahVal.longdir} onChange={(el) => {
                  changeQiblahVal("longdir", el.target.value)
                }}>
                  <option value="W">Barat</option>
                  <option value="N">Utara</option>
                  <option value="S">Selatan</option>
                  <option value="E">Timur</option>
                </select>
              </div>
            </div>
          </div>
          <div>

          </div>
        </div>
        <div>
          <div>
            <label htmlFor="">Date</label>
            <input type="date" value={qiblahVal.obsDate.toISOString().split("T")[0]} onChange={(ev) => {
              const date = new Date(ev.target.value)
              changeQiblahVal("obsDate", date)

            }} />
          </div>
          <div>
            <label htmlFor="">Time</label>
            <input type="time" value={qiblahVal.obstime.toTimeString().split(' ')[0].slice(0, 5)} onChange={(ev) => {
              const date = new Date()
              const [hour, minutes] = ev.target.value.split(":")
              date.setHours(parseInt(hour))
              date.setMinutes(parseInt(minutes))
              changeQiblahVal("obstime", date)

            }} />
          </div>
          <div>
            <button onClick={() => {
              submitData()
            }}>Apply</button>
          </div>
        </div>
      </div>

      {
        resultVal != null &&
        <>
          <div className="compass">
            <div>
              <div style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                height: "50%",
                backgroundColor: "red",
                width: ".2rem",
                transformOrigin: "bottom",
                rotate: `${resultVal.solarAzimuth}deg`,
                borderRadius: "1rem"
              }}>

              </div>
              <div style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                height: "50%",
                backgroundColor: "orange",
                width: ".2rem",
                transformOrigin: "bottom",
                rotate: `${resultVal.shadowAzimuth}deg`,
                borderRadius: "1rem"
              }}>

              </div>
              <div style={{
                position: "absolute",
                top: "47%",
                left: "47%",
                backgroundColor: "black",
                width: "6%",
                aspectRatio: "1/1",
                borderRadius: "10rem",
                transform: "translate(-50% -50%)"
              }}>

              </div>
            </div>

          </div>
          <div className="fullscreenbtn">
            <button onClick={() => {
              handle.enter()
            }}>Full Screen</button>
          </div>
          <div className="result">
            <div>
              <p style={{ color: "red" }}>Arah Kiblat : {resultVal.solarAzimuth.toFixed(2)} derajat</p>
              <p>Arah Bayangan : {resultVal.shadowAzimuth.toFixed(2)} derajat</p>
            </div>
            {/* <div>
              <p>Valid Sampai {formatTime} </p>
            </div> */}
          </div>

          <FullScreen handle={handle} >
            <div className="compass full" style={{
              display: handle.active == false ? "none" : "block"
            }}>
              <div>
                <div style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: "50%",
                  backgroundColor: "red",
                  width: ".2rem",
                  transformOrigin: "bottom",
                  rotate: `${resultVal.solarAzimuth}deg`,
                  borderRadius: "1rem"
                }}>

                </div>
                <div style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: "50%",
                  backgroundColor: "orange",
                  width: ".2rem",
                  transformOrigin: "bottom",
                  rotate: `${resultVal.shadowAzimuth}deg`,
                  borderRadius: "1rem"
                }}>

                </div>
                <div style={{
                  position: "absolute",
                  top: "47%",
                  left: "47%",
                  backgroundColor: "black",
                  width: "6%",
                  aspectRatio: "1/1",
                  borderRadius: "10rem",
                  transform: "translate(-50% -50%)"
                }}>

                </div>
              </div>
              <button onClick={() => {
                handle.exit()
              }}>

              </button>

            </div>
          </FullScreen>
        </>

      }

    </div>
  );
}

export default App
