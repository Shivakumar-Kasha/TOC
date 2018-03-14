/**
 * @Date:   02-06-2017 14:02:44
 * @Project: Asset Monitroing
 * @Last modified time: 06-06-2017 15:17:12
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for sensor server calls
 */
app.factory('sensorService', function($http, CONFIG_DATA) {
    var sensorServiceInfo = {};

    /**
     * Service call to add sensor information
     * @param  {JSON} data
     * @return {JSON} response
     */
    sensorServiceInfo.addSensor = function(data) {
        return $http
            .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.SENSOR.postMethod, data, {
                headers: CONFIG_DATA.HEADERS
            });
    };

    /**
     * Service call to get sensors information
     * @param  {JSON} data
     * @return {JSON} response
     */
    sensorServiceInfo.getSensors = function(data) {
        return $http
            .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.SENSOR.getMethod, data, {
                headers: CONFIG_DATA.HEADERS
            });
    };

    /**
     * Service call to update sensor information
     * @param  {JSON} data
     * @return {JSON} response
     */
    sensorServiceInfo.updateSensor = function(data) {
        return $http
            .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.SENSOR.putMethod, data, {
                headers: CONFIG_DATA.HEADERS
            });
    };

    /**
     * Service call to delete sensor information
     * @param  {JSON} data
     * @return {JSON} response
     */
    sensorServiceInfo.deleteSensor = function(data) {
        return $http
            .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.SENSOR.deleteMethod, data, {
                headers: CONFIG_DATA.HEADERS
            });
    };

    /**
     * Service call to get sensor information
     * @param  {JSON} data
     * @return {JSON} response
     */
    sensorServiceInfo.getSensorDetails = function(data) {
        return $http
            .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.SENSOR.getSensorDetails, data, {
                headers: CONFIG_DATA.HEADERS
            });
    };

    /**
     * Service call to delete sensor from model
     * @param  {JSON} data
     * @return {JSON} response
     */
    sensorServiceInfo.deleteSensorFromModel = function(data) {
        return $http
            .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.SENSOR.deleteSensorFromModel, data, {
                headers: CONFIG_DATA.HEADERS
            });
    };

    /**
     * Service call to clone sensor from master to tenant
     * @param  {JSON} data
     * @return {JSON} response
     */
    sensorServiceInfo.copySensorsFromMaster = function(data) {
        return $http
            .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.SENSOR.cloneSensor, data, {
                headers: CONFIG_DATA.HEADERS
            });
    };

    return sensorServiceInfo;
});
