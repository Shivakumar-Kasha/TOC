/**
 * @Date:   01-30-2017 17:01:66
 * @Project: 24/7PizzaBOX
 * @Last modified time: 2017-10-11T17:23:32+05:30
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Factory for models server calls
 */
app.factory('devicesService', function($window, $rootScope, $http, Session, CONFIG_DATA, AUTH_EVENTS) {
  var devicesServiceInfo = {};

  /**
   * Service call to add model information
   * @param  {JSON} data
   * @return {JSON} response
   */
  devicesServiceInfo.addDevice = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.DEVICES.postMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get models information
   * @param  {JSON} data
   * @return {JSON} response
   */
  devicesServiceInfo.getDevices = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.DEVICES.getMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to get specific model  information
   * @param  {JSON} data
   * @return {JSON} response
   */
  devicesServiceInfo.getModelDetails = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.getModelDetails, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to update model information
   * @param  {JSON} data
   * @return {JSON} response
   */
  devicesServiceInfo.updateDeviceInformation = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.DEVICES.putMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };


  /**
   * Service call to add sensors to  model information
   * @param  {JSON} data
   * @return {JSON} response
   */
  devicesServiceInfo.addSensorsToModel = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.addSensorsToModel, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to delete model information
   * @param  {JSON} data
   * @return {JSON} response
   */
  devicesServiceInfo.deleteModel = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.deleteMethod, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to clone models from master to tenant
   * @param  {JSON} data
   * @return {JSON} response
   */
  devicesServiceInfo.copyModelsFromMaster = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.MODELS.cloneModels, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  /**
   * Service call to delete device from model
   * @param  {JSON} data
   * @return {JSON} response
   */
  devicesServiceInfo.deleteDeviceFromModel = function(data) {
    return $http
      .post(CONFIG_DATA.SERVER_URL + CONFIG_DATA.DEVICES.deleteDeviceFromModel, data, {
        headers: CONFIG_DATA.HEADERS
      });
  };

  return devicesServiceInfo;
});
