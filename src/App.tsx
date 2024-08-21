import { useState, useEffect, useRef, useMemo } from "react";
import { useGeolocated } from "react-geolocated";
import './App.css'
import { performCalculation, qiblahval, setDefaultValues } from "./util/scriptUtil";

function App() {

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

  const [resultVal, setResultVal] = useState<ReturnType<typeof performCalculation> | null>(null)

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

  const timeInternal = useRef<any>(null)
  const [timeValid, setTimeValid]  = useState(0)
  const formatTime = useMemo(() => {
    if(timeValid == 0) {
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
    if (!isGeolocationAvailable) {
      alert("Your browser does not support Geolocation");
    } else if (!isGeolocationEnabled) {
      alert(
        "Geolocation is not enabled, Please allow the location check your setting"
      );
    } else if (coords) {
      // locationHandler(coords);
      setDefaultValues((dat) => {
        setQiblahVal(dat)
      })
      // startCompass()
    }
  }, [coords, isGeolocationAvailable, isGeolocationEnabled]);





  function submitData() {
    const result = performCalculation(qiblahVal)
    console.log(result)
    setResultVal(result)
    setTimeValid(result.durationMinutes * 60)
    clearInterval(timeInternal.current)
    timeInternal.current = setInterval(() => {
      setTimeValid(el => el-1)
    }, 1000)
    
  }

  return (
    <div className="App">
      <div>
        <div>
          <label>Latitude</label>
          <input id="" type="number" value={qiblahVal.latdeg} onChange={(el) => {
            changeQiblahVal("latdeg", el.target.value)
          }} />
          <input id="" type="number" value={qiblahVal.latmin} onChange={(el) => {
            changeQiblahVal("latmin", el.target.value)
          }} />
          <input id="" type="number" value={qiblahVal.latsec} onChange={(el) => {
            changeQiblahVal("latsec", el.target.value)
          }} />
          <select name="" id="" value={qiblahVal.latdir} onChange={(el) => {
            changeQiblahVal("latdir", el.target.value)
          }}>
            <option value="W">Barat</option>
            <option value="N">Utara</option>
            <option value="S">Selatan</option>
            <option value="E">Timur</option>
          </select>
        </div>
        <div>
          <label>Longitude</label>
          <input id="" type="number" value={qiblahVal.longdeg} onChange={(el) => {
            changeQiblahVal("longdeg", el.target.value)
          }} />
          <input id="" type="number" value={qiblahVal.longmin} onChange={(el) => {
            changeQiblahVal("longmin", el.target.value)
          }} />
          <input id="" type="number" value={qiblahVal.longsec} onChange={(el) => {
            changeQiblahVal("longsec", el.target.value)
          }} />
          <select name="" id="" value={qiblahVal.longdir} onChange={(el) => {
            changeQiblahVal("longdir", el.target.value)
          }}>
            <option value="W">Barat</option>
            <option value="N">Utara</option>
            <option value="S">Selatan</option>
            <option value="E">Timur</option>
          </select>
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
            const date = new Date(ev.target.value)
            changeQiblahVal("obsDate", date)

          }} />
        </div>
        <div>
          <button onClick={() => {
            submitData()
          }}>Apply</button>
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
                width: "1px",
                transformOrigin: "bottom",
                rotate: `${resultVal.qiblaDirection}deg`,
                borderRadius: "1rem"
              }}>

              </div>
              <div style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                height: "50%",
                backgroundColor: "black",
                width: "1px",
                transformOrigin: "bottom",
                rotate: `${resultVal.shadowAzimuth}deg`,
                borderRadius: "1rem"
              }}>

              </div>
              <div style={{
                position: "absolute",
                top: "46%",
                left: "47%",
                backgroundColor: "black",
                width: "25px",
                height: "25px",
                borderRadius: "1rem",
                transform: "translate(-50% -50%)"
              }}>

              </div>
            </div>

          </div>
          <div className="result">
              <div>
                <p>Arah Kiblat : {resultVal.qiblaDirection} derajat</p>
                <p>Arah Bayangan : {resultVal.shadowAzimuth} derajat</p>
              </div>
              <div>
                <p>Valid Sampai {formatTime} </p>
              </div>
          </div>
        </>

      }

    </div>
  );
}

export default App
