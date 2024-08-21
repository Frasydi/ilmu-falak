import SunCalc from "suncalc"
import moment from "moment-timezone"
// Convert DMS to decimal degrees using arrow function
const dmsToDecimal = (degrees: number, minutes: number, seconds: number, direction: directionType) => {
    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === 'S' || direction === 'W') decimal = -decimal;
    return decimal;
};
type directionType = "W" | "S" | "N" | "E"
// Calculate solar declination using arrow function
const calculateSolarDeclination = (dayOfYear: number) => 23.45 * Math.sin(toRadians((360 / 365) * (dayOfYear - 81)));

// Calculate hour angle using arrow function
const calculateHourAngle = (time: Date, solarNoonTime: Date) => {
    const solarNoon = solarNoonTime.getUTCHours() + (solarNoonTime.getUTCMinutes() / 60);
    const currentTime = time.getUTCHours() + (time.getUTCMinutes() / 60);
    return 15 * (currentTime - solarNoon); // 15° per hour
};

// Convert degrees to radians using arrow function
const toRadians = (degrees: number) => degrees * (Math.PI / 180);

// Perform the solar calculation and update the result display using arrow function
export const performCalculation = ({ latdeg, latdir, latmin, latsec, longdeg, longdir, longmin, longsec, obsDate, obstime }:
    qiblahval) => {
    // Get input values for latitude and longitude in DMS
    const newobsDate = obsDate.toISOString().split("T")[0]
    const newobstime = obstime.toTimeString().split(' ')[0].slice(0, 5)
    // Convert DMS to decimal degrees
    const latitude = dmsToDecimal(latdeg, latmin, latsec, latdir as directionType);
    const longitude = dmsToDecimal(longdeg, longmin, longsec, longdir as directionType);

    // Combine the observation date and time into a single Date object
    const observationDateTime = new Date(`${newobsDate}T${newobstime}:00`);

    // Calculate the day of the year for solar declination calculation
    const dayOfYear = Math.floor((observationDateTime.getTime() - new Date(observationDateTime.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);

    // Calculate solar declination
    const solarDeclination = calculateSolarDeclination(dayOfYear).toFixed(2);

    // Use SunCalc to calculate solar position
    const sunPos = SunCalc.getPosition(observationDateTime, latitude, longitude);

    // Calculate solar position: solar azimuth, solar elevation, and shadow azimuth
    const solarAzimuth = parseFloat(((sunPos.azimuth * (180 / Math.PI)) + 180).toFixed(2));
    const solarElevation = parseFloat((sunPos.altitude * (180 / Math.PI)).toFixed(2));
    const shadowAzimuth = parseFloat(((solarAzimuth + 180) % 360).toFixed(2));

    // Calculate Hour Angle using the observation time, longitude, and solar noon (assumed)
    const hourAngle = calculateHourAngle(observationDateTime, observationDateTime).toFixed(2);

    // Calculate Qibla direction (fixed direction to Mecca)
    const qiblaDirection = 292.48; // Mecca Qibla direction from most locations
    const solarQiblaDifference = Math.abs(solarAzimuth - qiblaDirection).toFixed(2);
    const shadowQiblaDifference = Math.abs(shadowAzimuth - qiblaDirection).toFixed(2);

    // Simulate duration of solar azimuth being the same
    const { durationMinutes, endTime } = calculateAzimuthDuration(observationDateTime, latitude, longitude, solarAzimuth);

    // Get timezone and display local time using moment-timezone
    const timezone = moment.tz.guess(); // Guess timezone based on user's system
    const localStartTime = moment.tz(observationDateTime, timezone).format('HH:mm:ss DD-MM-YYYY');
    const localEndTime = moment.tz(endTime, timezone).format('HH:mm:ss DD-MM-YYYY');

    // Display the results
    return {
        latitude: `${latdeg}° ${latmin}' ${latsec}" ${latdir}`,
        longitude: `${longdeg}° ${longmin}' ${longsec}" ${longdir}`,
        localtime: localStartTime,
        utctime: observationDateTime.toISOString().slice(0, 19).replace('T', ' '),
        solardeclination: solarDeclination,
        hourAngle: hourAngle,
        solarAzimuth,
        solarElevation,
        shadowAzimuth,
        qiblaDirection,
        solarQiblaDifference,
        shadowQiblaDifference,
        validUntil: `Valid for ${durationMinutes} minutes to go @ ${localStartTime} - ${localEndTime} (${timezone})`,
        durationMinutes
    }

};

// Simulate the duration of solar azimuth being the same using arrow function
const calculateAzimuthDuration = (startTime: Date, latitude: number, longitude: number, initialAzimuth: number) => {
    let durationMinutes = 0;
    let currentAzimuth = initialAzimuth;

    let currentTime = new Date(startTime.getTime());

    while (true) {
        currentTime.setMinutes(currentTime.getMinutes() + 1);
        const sunPos = SunCalc.getPosition(currentTime, latitude, longitude);
        currentAzimuth = parseFloat(((sunPos.azimuth * (180 / Math.PI)) + 180).toFixed(2));


        // if (Math.abs(ceil(currentAzimuth) - initialAzimuth) > tolerance) {
        //     break;
        // }
        if (Math.floor(currentAzimuth) !== Math.floor(initialAzimuth)) {
            break;
        }

        durationMinutes++;
    }

    return { durationMinutes, endTime: currentTime };
};

export type qiblahval = {
    latdeg: number,
    latmin: number,
    latsec: number,
    latdir: string,
    longdeg: number,
    longmin: number,
    longsec: number,
    longdir: string,
    obsDate: Date,
    obstime: Date
} 

// Set default values from device's GPS and current date/time using arrow function
export const setDefaultValues = (calback: (data:qiblahval) => void) => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const latDMS = convertToDMS(lat, 'lat');
            const lonDMS = convertToDMS(lon, 'lon');
            const now = new Date();

            calback(
                {
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
                })


        });
    }
};


// Convert decimal degrees to DMS and determine direction based on latitude or longitude
const convertToDMS = (decimal: number, type: "lat" | "lon") => {
    const absDecimal = Math.abs(decimal);
    const degrees = Math.floor(absDecimal);
    const minutes = Math.floor((absDecimal - degrees) * 60);
    const seconds = Math.round((absDecimal - degrees - minutes / 60) * 3600 * 1000) / 1000;

    // Determine direction based on the type (latitude or longitude)
    let direction;
    if (type === "lat") {
        direction = decimal >= 0 ? "N" : "S";  // Latitude: N for positive, S for negative
    } else if (type === "lon") {
        direction = decimal >= 0 ? "E" : "W";  // Longitude: E for positive, W for negative
    }

    return { degrees, minutes, seconds, direction };
};

