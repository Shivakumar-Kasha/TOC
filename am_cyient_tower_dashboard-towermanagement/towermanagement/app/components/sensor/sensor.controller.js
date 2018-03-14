/**
 * @Date:   02-06-2017 14:02:43
 * @Project: AssetMonitoring
 * @Last modified time: 07-11-2017 12:38:49
 * @Copyright: 2017, Kii Corporation www.kii.com
 */

'use strict';

/**
 * Controller to fetch sensor information
 */
angular.module('assetManagementApp').controller('SensorCtrl', function($rootScope, $scope, $uibModal, $translate, $compile, Session, USER_ROLES, CONFIG_DATA, DTOptionsBuilder, DTColumnBuilder, toastNotifier, persistData, logReport, dataTable, sensorService, alertNotifier) {

        alertNotifier.clearAlerts();
        var draw = null;
        var vm = this;
        vm.dtInstance = {};
        vm.sensors = {};
        vm.edit = editSensor;
        vm.delete = deleteSensor;

        $.fn.dataTable.ext.errMode = 'none';

        vm.dtOptions = DTOptionsBuilder.newOptions()
            .withOption('ajax', {
                url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.SENSOR.getMethod,
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
                            key: CONFIG_DATA.SEARCH.sensor.searchBy,
                            value: d.search.value.toLowerCase(),
                            filterType: CONFIG_DATA.SEARCH.sensor.filterType
                        };
                        d.filter.push(search);
                    }

                    logReport.info("Get Sensor Query", JSON.stringify(d));

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
                        logReport.info("Get Sensor Information", JSON.stringify(response));
                        return response;
                    }
                },
                error: function(error) {
                    logReport.error("Get Sensor Information", JSON.stringify(error));
                    toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
                }
            })
            .withDataProp(function(data) {
                return data.data;
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
            DTColumnBuilder.newColumn('c_name'),
            DTColumnBuilder.newColumn('units').notSortable(),
            DTColumnBuilder.newColumn(null).notSortable()
            .renderWith(actionsHtml)
        ];


        function createdRow(row, data, dataIndex) {
            // Recompiling so we can bind Angular directive to the DT
            $compile(angular.element(row).contents())($scope);
        }

        function actionsHtml(data, type, full, meta) {
            vm.sensors[data.id] = data;

            return '<div class="text-center"><button type="button" class="btn btn-warning btn-circle" title="Edit" ng-click="sensorInfo.edit(sensorInfo.sensors[' + data.id + '])" ng-disabled = "{{disableEditButton}}">' +
                '   <i class="fa fa-edit"></i></button>&nbsp;' +
                '<button type="button" class="btn btn-danger btn-circle" title="Delete" ng-click="sensorInfo.delete(sensorInfo.sensors[' + data.id + '])" )"="" ng-disabled = "{{disableDeleteButton}}">' +
                '   <i class="fa fa-trash-o"></i>' +
                '</button></div>';
        }
        if (Session.tenantType === USER_ROLES.tenant) {
            $scope.disableDeleteButton = "true";
            $scope.disableEditButton = "true";
        }
        //Add sensor Information
        $scope.addSensor = function(size) {
            $rootScope.modalInstance = $uibModal.open({
                templateUrl: 'addSensorPrompt.html',
                controller: 'AddSensorCtrl',
                size: size,
                backdrop: 'static',
                keyboard: true,
                resolve: {
                    vm: function() {
                        return vm;
                    }
                }
            });
        };

        // //Import sensor from master to tenant
        // if (Session.tenantType !== USER_ROLES.master) {
        //   sensorService.copySensorsFromMaster({
        //     userToken: Session.token
        //   }).then(function(result) {
        //     var customInfo = {
        //       successMessage: "",
        //       alreadyExists: "",
        //       errorMessage: ""
        //     };
        //
        //     logReport.info("Import Sensor From Master", JSON.stringify(result));
        //
        //     var validData = persistData.validifyData(result, customInfo);
        //
        //     if (Object.keys(validData).length !== 0) {
        //       vm.dtInstance.reloadData(null, false);
        //     }
        //   }, function(error) {
        //     logReport.error("Import Sensor From Master", JSON.stringify(error));
        //     toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
        //   });
        // }

        /**
         * Function to update sensor information
         * @param  {JSON} sensorInfo
         */
        function editSensor(sensorInfo) {
            $rootScope.modalInstance = $uibModal.open({
                templateUrl: 'addSensorPrompt.html',
                controller: 'EditSensorCtrl',
                backdrop: 'static',
                keyboard: true,
                resolve: {
                    sensorInfo: function() {
                        return sensorInfo;
                    },
                    vm: function() {
                        return vm;
                    }
                }
            });
        }

        /**
         * Function to delete sensor information
         * @param  {JSON} sensorInfo
         */
        function deleteSensor(sensorInfo) {
            logReport.info(JSON.stringify(sensorInfo))
            var sensorId = sensorInfo.c_id;
            if (sensorInfo.models.length === 0) {
                $rootScope.modalInstance = $uibModal.open({
                    templateUrl: 'deleteSensorPrompt.html',
                    controller: 'DeleteSensorCtrl',
                    backdrop: 'static',
                    keyboard: true,
                    resolve: {
                        sensorInfo: function() {
                            return sensorInfo;
                        },
                        vm: function() {
                            return vm;
                        }
                    }
                });
                return false;
            }

            $rootScope.modalInstance = $uibModal.open({
                templateUrl: 'modelListPrompt.html',
                controller: 'showModelListCtrl as modelsListInfo',
                backdrop: 'static',
                keyboard: true,
                resolve: {
                    sensorInfo: function() {
                        return sensorInfo;
                    },
                    vm: function() {
                        return vm;
                    }
                }
            });

        }
    })

    /**
     * Controller to add sensor information
     */
    .controller('AddSensorCtrl', function($scope, $translate, Session, sensorService, toastNotifier, persistData, usersService, logReport, vm, REG_EXP, CONFIG_DATA, alertNotifier) {
        alertNotifier.clearAlerts();
        $scope.Add_OR_EDIT_SENSOR = $translate.instant('CRUD.ADD');
        $scope.Add_or_Update = $translate.instant('BUTTONS.CREATE');
        $scope.mandatory_or_optional = $translate.instant('PLACE_HOLDERS.MANDATORY');
        $scope.sensor = {};

        $scope.sensorTypeOptions = CONFIG_DATA.SENSOR_TYPES;
        var imageDataUri = '';

        $scope.submit = function() {

            var sensorDetails = {
                userToken: Session.token,
                sensorData: $scope.sensor
            };
            logReport.info(JSON.stringify(sensorDetails));
            sensorService.addSensor(sensorDetails).
            then(function(result) {
                    var customInfo = {
                        successMessage: $translate.instant('SENSOR.SUCCESS.CREATION_SUCCESS'),
                        alreadyExists: $translate.instant('SENSOR.ERROR.ALREADY_EXISTS'),
                        errorMessage: $translate.instant('SENSOR.ERROR.CREATION_FAIL')
                    };

                    var validData = persistData.validifyData(result, customInfo);

                    if (Object.keys(validData).length !== 0) {
                        vm.dtInstance.reloadData(null, false);
                    }
                },
                function(error) {
                    logReport.error("Add Sensor Information", JSON.stringify(error));
                    toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
                }
            );
        };
    })

    /**
     * Controller to update sensor information
     */
    .controller('EditSensorCtrl', function($scope, $translate, Session, toastNotifier, sensorService, persistData, logReport, usersService, sensorInfo, CONFIG_DATA, vm, alertNotifier) {
        alertNotifier.clearAlerts();
        $scope.Add_OR_EDIT_SENSOR = $translate.instant('CRUD.EDIT');
        $scope.Add_or_Update = $translate.instant('BUTTONS.UPDATE');
        $scope.mandatory_or_optional = $translate.instant('PLACE_HOLDERS.OPTIONAL');
        var imageDataUri = '';
        $scope.sensorTypeOptions = CONFIG_DATA.SENSOR_TYPES;
        $scope.sensor = {
            sensorType: sensorInfo.sensorType,
            c_name: sensorInfo.c_name,
            units: sensorInfo.units
        };

        $scope.submit = function() {

            var data = {
                userToken: Session.token,
                c_id: sensorInfo.c_id,
                sensorData: $scope.sensor
            };

            sensorService.updateSensor(data).
            then(function(result) {
                var customInfo = {
                    successMessage: $translate.instant('SENSOR.SUCCESS.UPDATION_SUCCESS'),
                    alreadyExists: $translate.instant('SENSOR.ERROR.ALREADY_EXISTS'),
                    errorMessage: $translate.instant('SENSOR.ERROR.UPDATION_FAIL')
                };

                var validData = persistData.validifyData(result, customInfo);

                if (Object.keys(validData).length !== 0) {
                    vm.dtInstance.reloadData(null, false);
                }
            }, function(error) {
                logReport.error("Edit Sensor Information", JSON.stringify(error));
                toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
            });
        };
    })

    /**
     * Controller to delete sensor information
     */
    .controller('DeleteSensorCtrl', function($scope, $translate, Session, toastNotifier, sensorService, persistData, logReport, sensorInfo, vm, alertNotifier) {
        alertNotifier.clearAlerts();
        $scope.sensorNameToDelete = sensorInfo.c_name;

        $scope.deleteSensor = function() {
            sensorService.deleteSensor({
                userToken: Session.token,
                sensorId: sensorInfo.c_id
            }).
            then(function(result) {
                    var customInfo = {
                        successMessage: $translate.instant('SENSOR.SUCCESS.DELETION_SUCCESS'),
                        alreadyExists: '',
                        errorMessage: $translate.instant('SENSOR.ERROR.DELETION_FAIL')
                    };

                    var validData = persistData.validifyData(result, customInfo);

                    if (Object.keys(validData).length !== 0) {
                        vm.dtInstance.reloadData(null, false);
                    }
                },
                function(error) {
                    logReport.error("Delete Sensor Information", JSON.stringify(error));
                    toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
                }
            );
        };
    })

    /**
     * Controller to show models list
     */
    .controller('showModelListCtrl', function($scope, $rootScope, $translate, $compile, Session, toastNotifier, sensorService, persistData, dataTable, logReport, CONFIG_DATA, DTOptionsBuilder, DTColumnBuilder, sensorInfo, vm, alertNotifier) {
        alertNotifier.clearAlerts();

        var draw = null;
        var showModels = this;
        showModels.dtInstance = {};
        showModels.sensors = {};
        $.fn.dataTable.ext.errMode = 'none';

        showModels.dtOptions = DTOptionsBuilder.newOptions()
            .withOption('ajax', {
                url: CONFIG_DATA.SERVER_URL + CONFIG_DATA.SENSOR.getSensorDetails,
                type: 'POST',
                data: function(d) {
                    draw = d.draw;
                    d.userToken = Session.token;
                    d.sensorId = sensorInfo.c_id;
                    d.requiredRecords = d.length;
                    d.currentRecords = d.start;
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

                    logReport.info("Get Sensor Query", JSON.stringify(d));

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
                        logReport.info("Get Sensor for Model List  Information", JSON.stringify(response));
                        return response;
                    }
                },
                error: function(error) {
                    logReport.error("Get Sensor for Model List  Information", JSON.stringify(error));
                    toastNotifier.showError($translate.instant('Menu.SERVER_NOT_FOUND'));
                }
            })
            .withDataProp(function(data) {
                return data.data;
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

        showModels.dtColumns = [
            DTColumnBuilder.newColumn('c_name'),
        ];


        function createdRow(row, data, dataIndex) {
            // Recompiling so we can bind Angular directive to the DT
            $compile(angular.element(row).contents())($scope);
        }
    });