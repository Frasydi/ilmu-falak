import { useState, useEffect } from "react";
import { useGeolocated } from "react-geolocated";
import './App.css'
import { qiblahval, setDefaultValues, convertToDMS } from "./util/scriptUtil";
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
      qiblaDirection
      observationLocation {
        latitude
        longitude
      }
      observationTime {
        localTime
        utcTime
        timezoneOffset
      }
      solarAzimuthPeriod {
        solarAzimuthInt
        shadowAzimuthInt
        durationMinutes
        startTime
        endTime
        timezoneName
      }
    }
  }
`;

function App() {
  const client = useApolloClient();
  const [qiblahVal, setQiblahVal] = useState<qiblahval>({
    latdeg: 0,
    latdir: "N", // Default ke North untuk latitude
    latmin: 0,
    latsec: 0,
    longdeg: 0,
    longdir: "E", // Default ke East untuk longitude
    longmin: 0,
    longsec: 0,
    obsDate: new Date(),
    obstime: new Date()
  })

  const [resultVal, setResultVal] = useState<{
    solarAzimuth: number,
    shadowAzimuth: number,
    qiblaDirection: number,
    calculatedAt: Date,
    validUntil: Date,
    solarAzimuthPeriod?: {
      solarAzimuthInt: number,
      shadowAzimuthInt: number,
      durationMinutes: number,
      startTime: string,
      endTime: string,
      timezoneName: string
    },
    rawData?: {
      solarDeclination?: string,
      hourAngle?: string,
      solarElevation?: string,
      solarAzimuth?: string,
      shadowAzimuth?: string,
      sunAzimuthDifference?: string,
      shadowAzimuthDifference?: string,
      qiblaDirection?: string,
      observationLocation?: {
        latitude: string,
        longitude: string
      },
      observationTime?: {
        localTime: string,
        utcTime: string,
        timezoneOffset: string
      },
      solarAzimuthPeriod?: {
        solarAzimuthInt: number,
        shadowAzimuthInt: number,
        durationMinutes: number,
        startTime: string,
        endTime: string,
        timezoneName: string
      }
    }
  } | null>(null)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [showDetailReport, setShowDetailReport] = useState(false)
  const [isFullscreenMode, setIsFullscreenMode] = useState(false)

  const {
    coords,
    isGeolocationAvailable,
    isGeolocationEnabled
  } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache location for 1 minute
    },
    userDecisionTimeout: 10000,
    watchPosition: false
  });

  const handle = useFullScreenHandle();

  // Function to detect iOS device
  function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // Function to handle fullscreen for iOS compatibility
  function enterFullscreen() {
    if (isIOSDevice()) {
      // For iOS devices, use custom fullscreen mode
      setIsFullscreenMode(true);
      // Hide address bar on mobile Safari
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100);
    } else {
      // Try native fullscreen API for other devices
      if (handle.enter) {
        handle.enter();
      } else {
        // Fallback to custom fullscreen
        setIsFullscreenMode(true);
      }
    }
  }

  function exitFullscreen() {
    if (handle.exit && handle.active) {
      handle.exit();
    }
    setIsFullscreenMode(false);
  }

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle iOS orientation changes and viewport adjustments
  useEffect(() => {
    function handleOrientationChange() {
      if (isFullscreenMode && isIOSDevice()) {
        setTimeout(() => {
          window.scrollTo(0, 1);
        }, 100);
      }
    }

    function handleResize() {
      if (isFullscreenMode && isIOSDevice()) {
        setTimeout(() => {
          window.scrollTo(0, 1);
        }, 100);
      }
    }

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [isFullscreenMode]);

  // Helper function to get minutes remaining
  function getMinutesRemaining() {
    if (!resultVal) return 0;
    const now = new Date();
    const remaining = resultVal.validUntil.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / (1000 * 60)));
  }

  // Helper function to format validity period
  function getValidityPeriodInfo() {
    if (!resultVal) return '';
    
    // Gunakan data dari solarAzimuthPeriod jika tersedia
    if (resultVal.solarAzimuthPeriod) {
      const { durationMinutes, startTime, endTime, timezoneName } = resultVal.solarAzimuthPeriod;
      
      // Format: "11 Minutes to go @ 16:21:00 - 16:31:00 21-08-2024 (Asia/Makassar - WITA)"
      // Gunakan durationMinutes langsung dari GraphQL, bukan perhitungan lokal
      return `${durationMinutes} Minutes to go @ ${startTime} - ${endTime} (${timezoneName})`;
    }
    
    // Fallback ke perhitungan lama jika solarAzimuthPeriod tidak tersedia
    const minutesRemaining = getMinutesRemaining();
    const calculatedTime = resultVal.calculatedAt.toLocaleTimeString('id-ID', { hour12: false });
    const validUntilTime = resultVal.validUntil.toLocaleTimeString('id-ID', { hour12: false });
    const date = resultVal.calculatedAt.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneAbbr = new Intl.DateTimeFormat('id-ID', { 
      timeZoneName: 'short' 
    }).format(new Date()).split(' ').pop();

    return `${minutesRemaining} Minutes to go @ ${calculatedTime} - ${validUntilTime} ${date} (${timezone} - ${timezoneAbbr})`;
  }

  function useCurrentDateTime() {
    const now = new Date();
    setQiblahVal(prev => ({
      ...prev,
      obsDate: now,
      obstime: now
    }));
  }

  function changeQiblahVal(key: keyof qiblahval, value: string | number | Date) {
    setQiblahVal(el => {
      let newEl: qiblahval = structuredClone(el)

      newEl = { ...newEl, [key]: value }

      return newEl
    })
  }

  function refreshLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          const latDMS = convertToDMS(lat, 'lat');
          const lonDMS = convertToDMS(lon, 'lon');
          const now = new Date();
          
          setQiblahVal({
            latdeg: latDMS.degrees,
            latmin: latDMS.minutes,
            latsec: latDMS.seconds,
            latdir: latDMS.direction || "",
            longdeg: lonDMS.degrees,
            longmin: lonDMS.minutes,
            longsec: lonDMS.seconds,
            longdir: lonDMS.direction || "",
            obsDate: now,
            obstime: now
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Gagal mendapatkan lokasi GPS. Pastikan GPS aktif dan izin lokasi diberikan.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }

  useEffect(() => {
    if (coords) {
      // Menggunakan koordinat dari GPS device
      const lat = coords.latitude;
      const lon = coords.longitude;
      
      const latDMS = convertToDMS(lat, 'lat');
      const lonDMS = convertToDMS(lon, 'lon');
      const now = new Date();
      
      setQiblahVal({
        latdeg: latDMS.degrees,
        latmin: latDMS.minutes,
        latsec: latDMS.seconds,
        latdir: latDMS.direction || "",
        longdeg: lonDMS.degrees,
        longmin: lonDMS.minutes,
        longsec: lonDMS.seconds,
        longdir: lonDMS.direction || "",
        obsDate: now,
        obstime: now
      });
    } else {
      // Fallback ke default values jika GPS tidak tersedia
      setDefaultValues((dat) => {
        setQiblahVal(dat)
      })
    }
  }, [coords, isGeolocationAvailable, isGeolocationEnabled]);





  async function submitData() {
    try {
      // Ambil tanggal dan waktu dari input user
      const inputDate = qiblahVal.obsDate.toISOString().split("T")[0]; // YYYY-MM-DD
      const inputTime = qiblahVal.obstime.toTimeString().split(' ')[0].slice(0, 5); // HH:MM
      
      // Format sebagai local time (bukan UTC)
      const formattedDate = `${inputDate} ${inputTime}:00`;
      
      console.log('Input Date:', inputDate);
      console.log('Input Time:', inputTime);
      console.log('Formatted Local DateTime:', formattedDate);
      
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
      console.log('Raw API Response:', result)
      const data = result.data
      console.log('Solar Position Data:', data.solarPosition)
      
      // Pastikan nilai numerik dengan parsing yang benar
      // Gunakan waktu dari form, bukan waktu sekarang
      const formDateTime = new Date(qiblahVal.obsDate);
      formDateTime.setHours(qiblahVal.obstime.getHours());
      formDateTime.setMinutes(qiblahVal.obstime.getMinutes());
      formDateTime.setSeconds(qiblahVal.obstime.getSeconds());
      
      // Gunakan validUntil dari solarAzimuthPeriod jika tersedia dari GraphQL
      let validUntil = new Date(formDateTime.getTime() + 5 * 60 * 1000); // Default fallback 5 minutes
      
      if (data.solarPosition.solarAzimuthPeriod && data.solarPosition.solarAzimuthPeriod.durationMinutes) {
        // Gunakan durationMinutes dari GraphQL response
        const durationFromGraphQL = data.solarPosition.solarAzimuthPeriod.durationMinutes;
        validUntil = new Date(formDateTime.getTime() + durationFromGraphQL * 60 * 1000);
        console.log('Using duration from GraphQL:', durationFromGraphQL, 'minutes');
      }
      
      const processedData = {
        solarAzimuth: parseFloat(data.solarPosition.solarAzimuth) % 360,
        shadowAzimuth: parseFloat(data.solarPosition.shadowAzimuth) % 360,
        qiblaDirection: parseFloat(data.solarPosition.qiblaDirection) % 360,
        calculatedAt: formDateTime,
        validUntil: validUntil,
        solarAzimuthPeriod: data.solarPosition.solarAzimuthPeriod,
        rawData: data.solarPosition
      }
      
      // Pastikan nilai positif (0-360)
      if (processedData.solarAzimuth < 0) processedData.solarAzimuth += 360;
      if (processedData.shadowAzimuth < 0) processedData.shadowAzimuth += 360;
      if (processedData.qiblaDirection < 0) processedData.qiblaDirection += 360;
      
      console.log('Processed Data:', processedData)
      setResultVal(processedData)
    } catch (err) {
      console.error(err)
      if (err instanceof ApolloError) {
        console.log(err.cause)
        alert(err.message)
        return
      }
      alert("Terjadi Masalah")
    }
  }

  return (
    <div className="App">
      {showDetailReport ? (
        <div className="detail-report-page">
          <div className="detail-report-header">
            <button className="back-button" onClick={() => setShowDetailReport(false)}>
              ← Back to Results
            </button>
            <h1>Solar Position Calculation Report</h1>
          </div>
          
          <div className="detail-report-content">
            <div className="report-section">
              <h3>Solar Position calculation for Qibla direction</h3>
            </div>

            <div className="report-section">
              <h4>Observation Location:</h4>
              <div className="report-data">
                <div className="data-row">
                  <span className="label">Latitude</span>
                  <span className="value">: {qiblahVal.latdeg}° {qiblahVal.latmin}' {qiblahVal.latsec.toFixed(1)}" {qiblahVal.latdir}</span>
                </div>
                <div className="data-row">
                  <span className="label">Longitude</span>
                  <span className="value">: {qiblahVal.longdeg}° {qiblahVal.longmin}' {qiblahVal.longsec.toFixed(1)}" {qiblahVal.longdir}</span>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h4>Observation Time:</h4>
              <div className="report-data">
                <div className="data-row">
                  <span className="label">Local Time</span>
                  <span className="value">: {resultVal ? `${resultVal.calculatedAt.getFullYear()}/${(resultVal.calculatedAt.getMonth() + 1).toString().padStart(2, '0')}/${resultVal.calculatedAt.getDate().toString().padStart(2, '0')} ${resultVal.calculatedAt.toLocaleTimeString('id-ID', { hour12: false })} (${Intl.DateTimeFormat().resolvedOptions().timeZone} - ${new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).format(new Date()).split(' ').pop()})` : 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">UTC Time</span>
                  <span className="value">: {resultVal ? `${resultVal.calculatedAt.getUTCFullYear()}/${(resultVal.calculatedAt.getUTCMonth() + 1).toString().padStart(2, '0')}/${resultVal.calculatedAt.getUTCDate().toString().padStart(2, '0')} ${resultVal.calculatedAt.getUTCHours().toString().padStart(2, '0')}:${resultVal.calculatedAt.getUTCMinutes().toString().padStart(2, '0')}:${resultVal.calculatedAt.getUTCSeconds().toString().padStart(2, '0')}` : 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Timezone Offset</span>
                  <span className="value">: UTC{resultVal && resultVal.calculatedAt.getTimezoneOffset() <= 0 ? '+' : '-'}{resultVal ? Math.abs(resultVal.calculatedAt.getTimezoneOffset() / 60).toFixed(2) : '0'} hours</span>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h4>Qibla Direction: {resultVal?.qiblaDirection.toFixed(2)}° from the North</h4>
            </div>

            <div className="report-section">
              <h4>Solar Position:</h4>
              <div className="report-data">
                <div className="data-row">
                  <span className="label">Solar Declination</span>
                  <span className="value">: {resultVal?.rawData?.solarDeclination ? parseFloat(resultVal.rawData.solarDeclination).toFixed(2) : 'N/A'}°</span>
                </div>
                <div className="data-row">
                  <span className="label">Hour Angle</span>
                  <span className="value">: {resultVal?.rawData?.hourAngle ? parseFloat(resultVal.rawData.hourAngle).toFixed(2) : 'N/A'}°</span>
                </div>
                <div className="data-row">
                  <span className="label">Solar Elevation</span>
                  <span className="value">: {resultVal?.rawData?.solarElevation ? parseFloat(resultVal.rawData.solarElevation).toFixed(2) : 'N/A'}°</span>
                </div>
                <div className="data-row">
                  <span className="label">Solar Azimuth</span>
                  <span className="value">: {resultVal?.solarAzimuth.toFixed(2)}°</span>
                </div>
                <div className="data-row">
                  <span className="label">Shadow Azimuth</span>
                  <span className="value">: {resultVal?.shadowAzimuth.toFixed(2)}°</span>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h4>Solar Position in same Azimuth:</h4>
              <div className="report-data">
                {resultVal?.solarAzimuthPeriod ? (
                  <>
                    <div className="data-row">
                      <span className="label">Solar Azimuth (Integer)</span>
                      <span className="value">: {resultVal.solarAzimuthPeriod.solarAzimuthInt}°</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Shadow Azimuth (Integer)</span>
                      <span className="value">: {resultVal.solarAzimuthPeriod.shadowAzimuthInt}°</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Duration</span>
                      <span className="value">: {resultVal.solarAzimuthPeriod.durationMinutes} minutes</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Start Time</span>
                      <span className="value">: {resultVal.solarAzimuthPeriod.startTime}</span>
                    </div>
                    <div className="data-row">
                      <span className="label">End Time</span>
                      <span className="value">: {resultVal.solarAzimuthPeriod.endTime}</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Timezone</span>
                      <span className="value">: {resultVal.solarAzimuthPeriod.timezoneName}</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Valid until</span>
                      <span className="value">: {getValidityPeriodInfo()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="data-row">
                      <span className="label">Solar Azimuth</span>
                      <span className="value">: {resultVal ? Math.round(resultVal.solarAzimuth) : 0}°</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Shadow Azimuth</span>
                      <span className="value">: {resultVal ? Math.round(resultVal.shadowAzimuth) : 0}°</span>
                    </div>
                    <div className="data-row">
                      <span className="label">Valid until</span>
                      <span className="value">: {getValidityPeriodInfo()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="report-section">
              <h4>Difference between:</h4>
              <div className="report-data">
                <div className="data-row">
                  <span className="label">Solar Azimuth and Qibla Direction</span>
                  <span className="value">: {resultVal ? Math.abs(resultVal.solarAzimuth - resultVal.qiblaDirection).toFixed(2) : '0'}°</span>
                </div>
                <div className="data-row">
                  <span className="label">Shadow Azimuth and Qibla Direction</span>
                  <span className="value">: {resultVal ? Math.abs(resultVal.shadowAzimuth - resultVal.qiblaDirection).toFixed(2) : '0'}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : resultVal == null ? (
        <div className="form-container">
          <div className="header">
            <h1>Ilmu Falak Calculator</h1>
            <p>Calculate solar position and Qibla direction</p>
            {!isGeolocationAvailable ? (
              <div className="gps-status error">
                📍 Geolocation tidak tersedia di browser ini
              </div>
            ) : !isGeolocationEnabled ? (
              <div className="gps-status error">
                📍 Akses lokasi ditolak - mohon izinkan akses lokasi
              </div>
            ) : coords ? (
              <div className="gps-status success">
                ✅ Lokasi GPS berhasil dideteksi
                <button className="btn-refresh" onClick={refreshLocation}>
                  🔄 Refresh GPS
                </button>
                <div className="gps-coordinates">
                  📍 {coords.latitude.toFixed(6)}°, {coords.longitude.toFixed(6)}°
                  {coords.accuracy && (
                    <span> (±{coords.accuracy.toFixed(0)}m)</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="gps-status loading">
                🔄 Mendeteksi lokasi GPS...
              </div>
            )}
          </div>
          
          <div className="form-content">
            <div className="form-grid">
              <div className="form-section">
                <h3>📍 Latitude</h3>
                {!coords && (
                  <p className="manual-input-note">
                    💡 Koordinat akan terisi otomatis dari GPS. Anda juga dapat mengisi manual.
                    <br />
                    <small>Contoh: Jakarta (6° 12' 0" S), Yogyakarta (7° 47' 56" S)</small>
                  </p>
                )}
                <div className="coordinate-grid">
                  <div className="input-group">
                    <label htmlFor="lat-degrees">Degrees</label>
                    <input 
                      id="lat-degrees"
                      type="number" 
                      min="0"
                      max="90"
                      step="1"
                      placeholder="0"
                      value={qiblahVal.latdeg} 
                      onChange={(el) => changeQiblahVal("latdeg", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="lat-minutes">Minutes</label>
                    <input 
                      id="lat-minutes"
                      type="number" 
                      min="0"
                      max="59"
                      step="1"
                      placeholder="0"
                      value={qiblahVal.latmin} 
                      onChange={(el) => changeQiblahVal("latmin", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="lat-seconds">Seconds</label>
                    <input 
                      id="lat-seconds"
                      type="number" 
                      min="0"
                      max="59.999"
                      step="0.001"
                      placeholder="0.000"
                      value={qiblahVal.latsec} 
                      onChange={(el) => changeQiblahVal("latsec", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="lat-hemisphere">Hemisphere</label>
                    <select 
                      id="lat-hemisphere"
                      value={qiblahVal.latdir} 
                      onChange={(el) => changeQiblahVal("latdir", el.target.value)}
                    >
                      <option value="N">North (+ Utara)</option>
                      <option value="S">South (- Selatan)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>🌐 Longitude</h3>
                {!coords && (
                  <p className="manual-input-note">
                    <small>Contoh: Jakarta (106° 49' 0" E), Yogyakarta (110° 22' 5" E)</small>
                  </p>
                )}
                <div className="coordinate-grid">
                  <div className="input-group">
                    <label htmlFor="lon-degrees">Degrees</label>
                    <input 
                      id="lon-degrees"
                      type="number" 
                      min="0"
                      max="180"
                      step="1"
                      placeholder="0"
                      value={qiblahVal.longdeg} 
                      onChange={(el) => changeQiblahVal("longdeg", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="lon-minutes">Minutes</label>
                    <input 
                      id="lon-minutes"
                      type="number" 
                      min="0"
                      max="59"
                      step="1"
                      placeholder="0"
                      value={qiblahVal.longmin} 
                      onChange={(el) => changeQiblahVal("longmin", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="lon-seconds">Seconds</label>
                    <input 
                      id="lon-seconds"
                      type="number" 
                      min="0"
                      max="59.999"
                      step="0.001"
                      placeholder="0.000"
                      value={qiblahVal.longsec} 
                      onChange={(el) => changeQiblahVal("longsec", el.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="lon-hemisphere">Hemisphere</label>
                    <select 
                      id="lon-hemisphere"
                      value={qiblahVal.longdir} 
                      onChange={(el) => changeQiblahVal("longdir", el.target.value)}
                    >
                      <option value="E">East (+ Timur)</option>
                      <option value="W">West (- Barat)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section datetime-section">
                <h3>⏰ Date & Time</h3>
                <p className="timezone-info">
                  🌍 Input menggunakan waktu lokal (Local Time)
                  <br />
                  <small>
                    Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone} 
                    | Sekarang: {new Date().toLocaleString('id-ID')}
                  </small>
                </p>
                <div className="datetime-grid">
                  <div className="input-group">
                    <label htmlFor="obs-date">Date</label>
                    <input 
                      id="obs-date"
                      type="date" 
                      value={qiblahVal.obsDate.toISOString().split("T")[0]} 
                      onChange={(ev) => {
                        const date = new Date(ev.target.value)
                        changeQiblahVal("obsDate", date)
                      }} 
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="obs-time">Time</label>
                    <input 
                      id="obs-time"
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
                  <div className="input-group datetime-button-group">
                    <button 
                      type="button" 
                      className="btn-current-time" 
                      onClick={useCurrentDateTime}
                      title="Set to current date and time"
                    >
                      🕐 Use Current Time
                    </button>
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
                {/* Debug: Tambahan marker untuk orientasi */}
                {/* <div className="compass-debug">
                  <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px' }}>N (0°)</div>
                  <div style={{ position: 'absolute', right: '-15px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px' }}>E (90°)</div>
                  <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px' }}>S (180°)</div>
                  <div style={{ position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px' }}>W (270°)</div>
                </div> */}
                
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
                <div 
                  className="compass-needle qibla-needle"
                  style={{
                    transform: `translateX(-50%) rotate(${resultVal.qiblaDirection}deg)`
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
              <div className="legend-item">
                <div className="legend-color legend-qibla"></div>
                <span>Qibla Direction</span>
              </div>
            </div>
          </div>

          <div className="results-grid">
            <div className="result-card">
              <h4>Qibla Direction</h4>
              <p className="result-value qibla-value">
                {resultVal.qiblaDirection.toFixed(2)}°
              </p>
            </div>
            <div className="result-card">
              <h4>Solar Direction</h4>
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

          <div className="validity-info">
            <div className="validity-card">
              <h4>⏰ Valid Until</h4>
              <p className="validity-time">
                {getValidityPeriodInfo()}
              </p>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => setResultVal(null)}>
              ← Back to Form
            </button>
            <button className="btn-primary" onClick={() => setShowDetailReport(true)}>
              📊 Detail Report
            </button>
            <button className="btn-primary" onClick={enterFullscreen}>
              📱 Fullscreen View
            </button>
          </div>

          <FullScreen handle={handle}>
            <div className={`fullscreen-compass ${isFullscreenMode ? 'ios-fullscreen' : ''}`} style={{ display: handle.active || isFullscreenMode ? "flex" : "none" }}>
              {/* Live Clock at Top */}
              <div className="fullscreen-clock">
                <p className="live-date">
                  {currentTime.toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <h2 className="live-time">
                  {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
                </h2>
                
              </div>

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
                  <div 
                    className="compass-needle qibla-needle"
                    style={{
                      transform: `translateX(-50%) rotate(${resultVal.qiblaDirection}deg)`
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
                <div className="legend-item">
                  <div className="legend-color legend-qibla"></div>
                  <span>Qibla Direction: {resultVal.qiblaDirection.toFixed(2)}°</span>
                </div>
              </div>

              {/* Valid Until at Bottom */}
              <div className="fullscreen-validity">
                <p className="validity-text">
                  <strong>Valid until: </strong>{getValidityPeriodInfo()}
                </p>
              </div>
              
              <button className="close-button" onClick={exitFullscreen} />
            </div>
          </FullScreen>
        </div>
      )}
    </div>
  );
}

export default App
