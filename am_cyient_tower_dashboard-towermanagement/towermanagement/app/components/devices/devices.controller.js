/**
 * @Date:   02-21-2017 10:02:53
 * @Project: AssetMonitoring
 * @Last modified time: 2017-10-11T17:23:45+05:30
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch Model information
 */
angular.module('assetManagementApp').controller('DevicesCtrl', function($rootScope, $window, $scope, $uibModal, $compile, $log, $q, $sanitize, Session, USER_ROLES, CONFIG_DATA, AUTH_EVENTS, toastNotifier, alertNotifier, persistData, $translate, dataTable, DTOptionsBuilder, DTColumnBuilder, logReport, devicesService, assetTypeService, sensorService) {
    alertNotifier.clearAlerts();
    var draw = null;
    var vm = this;
    vm.dtInstance = {};
    vm.models = {};
    vm.delete = deleteDevice;
    vm.edit = editDeviceInformation;
    vm.models = {};

    $.fn.dataTable.ext.errMode = 'none';

    $scope.onClick = function(id) {
      var sessionInfo = JSON.parse($window.sessionStorage["sessionInfo"]);
      sessionInfo['DeviceId'] = vm.models[id].c_id;
      $window.sessionStorage["sessionInfo"] = JSON.stringify(sessionInfo);
    };
    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('ajax', {
        url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.DEVICES.getMethod,
        type: 'POST',
        data: function(d) {
          draw = d.draw;
          d.userToken = Session.token;
          d.nextPaginationKey = CONFIG_DATA.DATA_TABLE.records + "/" + d.start;
          d.filter = [];

          if (d.order[0].column === 0) {
            d.order = {
              dir: d.order[0].dir,
              column: 'c_name'
            };
          }

          if (persistData.isValid(d.search.value)) {
            var search = {
              key: CONFIG_DATA.SEARCH.models.searchBy,
              value: d.search.value.toLowerCase(),
              filterType: CONFIG_DATA.SEARCH.models.filterType
            };
            d.filter.push(search);
          }

          logReport.info("Get model Query", JSON.stringify(d));

          return JSON.stringify(d);
        },
        headers: CONFIG_DATA.HEADERS,
        beforeSend: function() {
          $rootScope.ajaxloading = true;
          if (!$rootScope.$$phase) {
            $rootScope.$apply();
          }
        },
        complete: function() {
          $rootScope.ajaxloading = false;
          $rootScope.$apply();
        },
        dataType: "json",
        converters: {
          "text json": function(result) {
            var response = dataTable.filterData(result, draw);
            logReport.info("Get Models Information", JSON.stringify(response));
            return response;
          }
        },
        error: function(error) {
          logReport.error("Get Models Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      })
      .withDataProp(function(result) {
        return result.data;
      })
      .withBootstrap()
      .withOption('lengthMenu', [
        [10, 20, 30, 40],
        [10, 20, 30, 40]
      ])
      .withOption('responsive', {
        details: {
          renderer: function(api, rowIndex) {
            var data = dataTable.rendererRows(api, rowIndex);
            // gets the table and append the rows
            var table = angular
              .element('<table/>')
              .append(data);

            // compile the table to keep the events
            $compile(table.contents())($scope);

            return table;
          }
        }
      })
      .withOption('createdRow', createdRow)
      .withOption('language', {
        searchPlaceholder: $translate.instant('PLACE_HOLDERS.ENTER_NAME')
      })
      .withOption('serverSide', true);

    vm.dtColumns = [
      DTColumnBuilder.newColumn(null).renderWith(modelInfoHtml),
      DTColumnBuilder.newColumn(null).notSortable()
      .renderWith(actionsHtml)
    ];

    function createdRow(row, data, dataIndex) {
      // Recompiling so we can bind Angular directive to the DT
      $compile(angular.element(row).contents())($scope);
    }

    function actionsHtml(data, type, full, meta) {
      vm.models[data.id] = data;
      return '<div class="text-center">' +
        '<button type="button" class="btn btn-danger btn-circle" title="Delete" ng-click="devicesInfo.delete(devicesInfo.models[' + data.id + '])" )"="" ng-disabled = "{{disabledeleteDeviceButton}}">' +
        '   <i class="fa fa-trash-o"></i>' +
        '</button>' +
        '</div>';
    }

    if (Session.tenantType === USER_ROLES.tenant) {
      $scope.disabledeleteDeviceButton = "true";
    }

    function modelInfoHtml(data, type, full, meta) {
      vm.models[data.id] = data;
      return '<a ui-sref="app.device-info" ng-click="onClick(' + data.id + ')"> ' + $sanitize(data.c_name) + ' </a>';
    }


    // Add Model
    $scope.openAddDevicePrompt = function(size) {

      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addDevicePrompt.html',
        controller: 'AddDeviceCtrl as devicesInfo',
        size: 'lg',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          vm: function() {
            return vm;
          }
        }
      });
    };


    /**
     * Function to Edit Model
     * @param  {JSON} modelInfo
     */
    function editDeviceInformation(deviceInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'addDevicePrompt.html',
        controller: 'EditDeviceInformationCtrl as devicesInfo',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          deviceInfo: function() {
            return deviceInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }

    /**
     * Function to delete Model
     * @param  {JSON} deviceInfo
     */
    function deleteDevice(deviceInfo) {
      $rootScope.modalInstance = $uibModal.open({
        templateUrl: 'deleteDevicePrompt.html',
        controller: 'DeleteDeviceCtrl',
        backdrop: 'static',
        keyboard: true,
        resolve: {
          deviceInfo: function() {
            return deviceInfo;
          },
          vm: function() {
            return vm;
          }
        }
      });
    }

  })

  /**
   * Controller to add model
   */
  .controller('AddDeviceCtrl', function($rootScope, $scope, $compile, REG_EXP, $sanitize, $uibModal, $uibModalInstance, $translate, $q, Session, persistData, dataTable, CONFIG_DATA, AUTH_EVENTS, logReport, toastNotifier, vm, devicesService, DTOptionsBuilder, DTColumnBuilder, assetTypeService, utilityFunctions, alertNotifier) {
    alertNotifier.clearAlerts();
    $scope.Add_or_Update_Device = $translate.instant('CRUD.ADD');
    $scope.Add_or_Update = $translate.instant('BUTTONS.CREATE');
    $scope.mandatory_or_optional = $translate.instant('PLACE_HOLDERS.MANDATORY');
    $scope.assetDetails = {};

    //Model Properties
    angular.extend($scope, {
      template: {
        form: {}
      },
      keys: [0],
      readingsArray: [0],
      labelArray: [0],
      max_model_properties: CONFIG_DATA.MAX_MODEL_PROPERTIES
    });
    $scope.addPropertyKey = function() {
      if ($scope.keys.length >= $scope.max_model_properties) {
        return false;
      }
      var newItemNo = $scope.keys[$scope.keys.length - 1] + 1;
      $scope.keys.push(newItemNo);
      //$scope.template[key[newItemNo-1].id].type="string";
    };



    $scope.removePropertyKey = function(removeItemKey) {
      var lastItem = $scope.keys.length - 1;
      if (lastItem > 0) {
        var tempKey = [];
        for (var ind = 0; ind < $scope.keys.length; ind++) {
          if ($scope.keys[ind] !== removeItemKey) {
            tempKey[tempKey.length] = $scope.keys[ind];
          }
        }
        $scope.keys = tempKey;
        delete $scope.template.form[removeItemKey];
      }
    };
    $scope.addReadingKey = function() {
      if ($scope.readingsArray.length >= $scope.max_model_properties) {
        return false;
      }
      var newItemNo = $scope.readingsArray[$scope.readingsArray.length - 1] + 1;
      $scope.readingsArray.push(newItemNo);
      //$scope.template[key[newItemNo-1].id].type="string";
    };

    $scope.removeReadingKey = function(removeItemKey) {
      var lastItem = $scope.readingsArray.length - 1;
      if (lastItem > 0) {
        var tempKey = [];
        for (var ind = 0; ind < $scope.readingsArray.length; ind++) {
          if ($scope.readingsArray[ind] !== removeItemKey) {
            tempKey[tempKey.length] = $scope.readingsArray[ind];
          }
        }
        $scope.readingsArray = tempKey;
        delete $scope.template.form[removeItemKey];
      }
    };
    //copy Device Reading Label to Id
    $scope.copyText = function(name, itemKey) {
      //  var regExp = /^[^`~!@#$%\^&*()_+={}|[\]\\:';"<>?,./1-9]*$/;
      var lastItem = $scope.readingsArray.length - 0;
      if (lastItem > 0) {
        var tempKey = [];
        for (var ind = 0; ind < $scope.readingsArray.length; ind++) {
          if ($scope.readingsArray[ind] !== itemKey) {
            tempKey[tempKey.length] = $scope.readingsArray[ind];
          }
        }
        var nameToDisplay = name.toLowerCase();
        var id = "";
        id = nameToDisplay.replace(/[^A-Z0-9 ]/ig, "");
        nameToDisplay = id.replace(/\s+/g, "-");
        $scope.template.form[itemKey].id = nameToDisplay.trim();
      }
    }
    //copy Device Property Label to Id

    $scope.copyPropertyLabel = function(propertyID, propertyKey) {
      var lastItem = $scope.keys.length - 0;
      if (lastItem > 0) {
        var tempKey = [];
        for (var ind = 0; ind < $scope.keys.length; ind++) {
          if ($scope.keys[ind] !== propertyKey) {
            tempKey[tempKey.length] = $scope.keys[ind];
          }
        }
        var propertyIdToDisplay = propertyID.toLowerCase();
        var property = "";
        property = propertyIdToDisplay.replace(/[^A-Z0-9 ]/ig, "");
        propertyIdToDisplay = property.replace(/\s+/g, "-");
        $scope.template.form[propertyKey].propertyId = propertyIdToDisplay.trim();
      }
    }
    $scope.submit = function() {
      var readings = [];
      var data = {};
      var readings = [];
      angular.forEach($scope.readingsArray, function(key) {
        var required = "";
        var units = "";
        if (persistData.isValid($scope.template.form[key].units)) {
          units = $scope.template.form[key].units;
        } else {
          units = "";
        }
        var displayName = utilityFunctions.lowerCaseFirstLetter($scope.template.form[key].displayName);
        readings.push({
          label: $scope.template.form[key].displayName,
          type: $scope.template.form[key].readingType,
          units: units,
          internal_name: $scope.template.form[key].id
        });
      });

      var deviceProperties = [];
      angular.forEach($scope.keys, function(key) {
        var required = "";
        var hint = "";
        logReport.info("keysrequired:", $scope.template.form[key].required);

        if ($scope.template.form[key].required) {
          logReport.info("required:", $scope.template.form[key].required);
          required = true;
        } else {
          logReport.info("requiredelse:", $scope.template.form[key].required);
          required = false;
        }
        if (persistData.isValid($scope.template.form[key].hint)) {
          hint = $scope.template.form[key].hint;
        } else {
          hint = "";
        }

        deviceProperties.push({
          label: $scope.template.form[key].label,
          type: $scope.template.form[key].type,
          hint: hint,
          internal_name: $scope.template.form[key].propertyId,
          required: required
        });
      });
      logReport.info("deviceProperties:", JSON.stringify(deviceProperties));
      data.customProperties = deviceProperties;
      data.c_name = $scope.template.deviceName;
      data.readings = readings;
      var inputInfo = {
        userToken: Session.token,
        modelData: data
      };

      logReport.info("Input For Adding Model with properties:", JSON.stringify(inputInfo));
      devicesService.addDevice(inputInfo).then(function(result) {
          var customInfo = {
            successMessage: $translate.instant('DEVICES.SUCCESS.CREATION_SUCCESS'),
            alreadyExists: $translate.instant('DEVICES.ERROR.ALREADY_EXISTS'),
            errorMessage: $translate.instant('DEVICES.ERROR.CREATION_FAIL')
          };
          var validData = persistData.validifyData(result, customInfo);
          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
        },
        function(error) {
          logReport.error("Add Device Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );

    };
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  })
  /**
   * Controller to edit device information
   */
  // .controller('EditDeviceInformationCtrl', function($rootScope, $scope, $compile, $sanitize, $uibModal, $uibModalInstance, $translate, $q, Session, persistData, dataTable, CONFIG_DATA, AUTH_EVENTS, logReport, toastNotifier, vm, devicesService, DTOptionsBuilder, DTColumnBuilder, assetTypeService, utilityFunctions, alertNotifier, deviceInfo) {
  //   alertNotifier.clearAlerts();
  //   logReport.info(JSON.stringify(deviceInfo));
  //   $scope.Add_or_Update_Device = $translate.instant('CRUD.UPDATE');
  //   $scope.Add_or_Update = $translate.instant('BUTTONS.UPDATE');
  //   $scope.mandatory_or_optional = $translate.instant('PLACE_HOLDERS.MANDATORY');
  //
  //   var deviceProperties = deviceInfo.customProperties;
  //   var deviceReadings = deviceInfo.readings;
  //   angular.extend($scope, {
  //     template: {
  //       deviceName: deviceInfo.c_name,
  //       form: {}
  //     },
  //     keys: [],
  //     readingsArray: [],
  //     max_model_properties: CONFIG_DATA.MAX_MODEL_PROPERTIES
  //
  //   });
  //   $scope.addReadingKey = function() {
  //
  //     if ($scope.readingsArray.length >= $scope.max_model_properties) {
  //       return false;
  //     }
  //     var newItemNo = $scope.readingsArray[$scope.readingsArray.length - 1] + 1;
  //     $scope.readingsArray.push(newItemNo);
  //   };
  //
  //   $scope.removeReadingKey = function(removeItemKey) {
  //     var lastItem = $scope.readingsArray.length - 1;
  //     if (lastItem > 0) {
  //       var tempKey = [];
  //       for (var ind = 0; ind < $scope.readingsArray.length; ind++) {
  //         if ($scope.readingsArray[ind] !== removeItemKey) {
  //           tempKey[tempKey.length] = $scope.readingsArray[ind];
  //         }
  //       }
  //       $scope.readingsArray = tempKey;
  //       delete $scope.template.form[removeItemKey];
  //     }
  //   };
  //   $scope.addPropertyKey = function() {
  //     if ($scope.keys.length >= $scope.max_model_properties) {
  //       return false;
  //     }
  //     var newItemNo = $scope.keys[$scope.keys.length - 1] + 1;
  //     $scope.keys.push(newItemNo);
  //     //$scope.template[key[newItemNo-1].id].type="string";
  //   };
  //
  //   $scope.removePropertyKey = function(removeItemKey) {
  //     var lastItem = $scope.keys.length - 1;
  //     if (lastItem > 0) {
  //       var tempKey = [];
  //       for (var ind = 0; ind < $scope.keys.length; ind++) {
  //         if ($scope.keys[ind] !== removeItemKey) {
  //           tempKey[tempKey.length] = $scope.keys[ind];
  //         }
  //       }
  //       $scope.keys = tempKey;
  //       delete $scope.template.form[removeItemKey];
  //     }
  //   };
  //   // $scope.template = {
  //   //   deviceName: deviceInfo.c_name
  //   // }
  //   angular.forEach(deviceInfo.readings, function(deviceReading, index) {
  //     $scope.readingsArray.push(index);
  //
  //     angular.forEach(deviceProperties, function(deviceProperty) {
  //       $scope.keys.push(index);
  //       $scope.template.form[index] = {
  //         label: deviceProperty.internal_name,
  //         type: deviceProperty.type,
  //         hint: deviceProperty.hint,
  //         required: deviceProperty.required,
  //         displayName: deviceReading.internal_name,
  //         units: deviceReading.units,
  //         readingType: deviceReading.type
  //
  //       };
  //     })
  //   })
  //
  //   $scope.submit = function() {
  //     var readings = [];
  //     var data = {};
  //     var readings = [];
  //     angular.forEach($scope.readingsArray, function(key) {
  //       var required = "";
  //       var units = "";
  //       if (persistData.isValid($scope.template.form[key].units)) {
  //         units = $scope.template.form[key].units;
  //       } else {
  //         units = "";
  //       }
  //       var displayName = utilityFunctions.lowerCaseFirstLetter($scope.template.form[key].displayName);
  //       readings.push({
  //         label: $scope.template.form[key].displayName,
  //         type: $scope.template.form[key].readingType,
  //         units: units,
  //         internal_name: displayName.toLowerCase()
  //       });
  //     });
  //
  //     var deviceProperties = [];
  //     angular.forEach($scope.keys, function(key) {
  //       var required = "";
  //       var hint = "";
  //       logReport.info("keysrequired:", $scope.template.form[key].required);
  //
  //       if ($scope.template.form[key].required) {
  //         logReport.info("required:", $scope.template.form[key].required);
  //         required = true;
  //       } else {
  //         logReport.info("requiredelse:", $scope.template.form[key].required);
  //         required = false;
  //       }
  //       if (persistData.isValid($scope.template.form[key].hint)) {
  //         hint = $scope.template.form[key].hint;
  //       } else {
  //         hint = "";
  //       }
  //       var label = utilityFunctions.lowerCaseFirstLetter($scope.template.form[key].label);
  //       deviceProperties.push({
  //         label: $scope.template.form[key].label,
  //         type: $scope.template.form[key].type,
  //         hint: hint,
  //         internal_name: label.toLowerCase(),
  //         required: required
  //       });
  //     });
  //     logReport.info("deviceProperties:", JSON.stringify(deviceProperties));
  //     data.customProperties = deviceProperties;
  //     //  data.c_name = $scope.template.deviceName;
  //     if ($scope.template.deviceName !== deviceInfo.c_name) {
  //       data.c_name = $scope.template.deviceName;
  //     } else {
  //
  //     }
  //     data.readings = readings;
  //     var inputInfo = {
  //       userToken: Session.token,
  //       objectId: deviceInfo.objectID,
  //       modelData: data
  //     };
  //
  //     logReport.info("Input For updating devices with properties:", JSON.stringify(inputInfo));
  //     devicesService.updateDeviceInformation(inputInfo).then(function(result) {
  //         var customInfo = {
  //           successMessage: $translate.instant('DEVICES.SUCCESS.UPDATION_SUCCESS'),
  //           alreadyExists: $translate.instant('DEVICES.ERROR.ALREADY_EXISTS'),
  //           errorMessage: $translate.instant('DEVICES.ERROR.UPDATION_FAIL')
  //         };
  //         var validData = persistData.validifyData(result, customInfo);
  //         if (Object.keys(validData).length !== 0) {
  //           vm.dtInstance.reloadData(null, false);
  //         }
  //       },
  //       function(error) {
  //         logReport.error("Update  Device Information", JSON.stringify(error));
  //         toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
  //       }
  //     );
  //
  //   };
  //
  // })
  // /**
  //  * Controller to delete Model
  //  */
  .controller('DeleteDeviceCtrl', function($scope, $rootScope, $translate, Session, persistData, logReport, toastNotifier, devicesService, deviceInfo, vm) {

    $scope.deleteDeviceName = deviceInfo.c_name;

    function deleteDevice() {
      var deleteData = {
        userToken: Session.token,
        c_id: deviceInfo.c_id
      };
      logReport.info("Delete Device Information:", JSON.stringify(deleteData));
      devicesService.deleteDevice(deleteData).
      then(function(result) {
          var customInfo = {
            successMessage: '',
            alreadyExists: '',
            errorMessage: $translate.instant('DEVICES.ERROR.DELETION_FAIL')
          };

          var validData = persistData.validifyData(result, customInfo);
          var recordExists = validData.data.recordsExists;
          if (Object.keys(validData).length !== 0) {
            vm.dtInstance.reloadData(null, false);
          }
          if (recordExists === 0) {
            toastNotifier.showSuccess($translate.instant('DEVICES.SUCCESS.DELETION_SUCCESS'));
            vm.dtInstance.reloadData(null, false);
            $rootScope.modalInstance.close();
          } else {
            deleteDevices();
          }
        },
        function(error) {
          logReport.error("Delete Device Information", JSON.stringify(error));
          toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        }
      );
    }
    $scope.deleteDevice = function() {

      deleteDevice();
    };

  });
