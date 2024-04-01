/* Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end */


'use strict';

(function () {
    angular
        .module('cybersponse')
        .factory('fortiAiConfigService', fortiAiConfigService);

    fortiAiConfigService.$inject = ['$http', '$q', 'API', '$resource', 'toaster'];

    function fortiAiConfigService($http, $q, API, $resource, toaster) {

        var service = {
            constants: constants,
            getKeyStoreRecord: getKeyStoreRecord,
            updateConfigurationRecord: updateConfigurationRecord,
            loadConnectorData: loadConnectorData
        }
        return service;
        
        function constants() {
            return {
                queryForKeyStore:{
                    "sort": [
                      {
                        "field": "id",
                        "direction": "ASC",
                        "_fieldName": "id"
                      }
                    ],
                    "limit": 30,
                    "logic": "AND",
                    "filters": [
                      {
                        "field": "key",
                        "operator": "like",
                        "_operator": "like",
                        "value": "%FortiAI Configurations%",
                        "type": "primitive"
                      },
                      {
                        "sort": [],
                        "limit": 30,
                        "logic": "AND",
                        "filters": []
                      }
                    ],
                    "__selectFields": [
                      "id",
                      "key",
                      "value",
                      "notes",
                      "@id",
                      "@type",
                      "jSONValue"
                    ]
                },
                defaultLLMIntegration:{
                  "title": "",
                  "name": "",
                  "conversationModel": "",
                  "pBGenerationModel": "",
                  "isMultiConfigAvailable": "",
                  "modelList": [],
                  "llmIntegrationsList": []
                }
            }
        }

        function getKeyStoreRecord(queryObject, module) {
            var defer = $q.defer();
            var url = API.QUERY + module;
            $resource(url).save(queryObject, function (response) {
                defer.resolve(response);
            }, function (err) {
                defer.reject(err);
            })
            return defer.promise;
        }

        function updateConfigurationRecord(keyStoreValue, recordUUID) {
            $resource(API.API_3_BASE + 'keys' + '/' + recordUUID, null, {
              'update': {
                method: 'PUT'
              }
            }).update({ 'jSONValue': keyStoreValue}).$promise.then(function () {
            });
            toaster.success({
              body: 'Successfully updated FortiAI Configuration.'
            });
        }
        
        function loadConnectorData(connectorName) {
            var defer = $q.defer();
            var queryPayload = {
                "page": 1,
                "limit": 30,
                "logic": "AND",
                "filters": [{
                    "field": "name",
                    "operator": "eq",
                    "value": connectorName
                }]
            };
            var queryUrl = API.QUERY + 'solutionpacks?$limit=30&$page=1';
            $http.post(queryUrl, queryPayload).then(function (response) {
                var connectors = response.data['hydra:member'];
                var selectedConnector = connectors[0];
                if (selectedConnector.status === null) {
                    toaster.error({
                        body: 'The Connector "' + connectorName + '" is not installed. Install the connector and re-run this wizard to complete the configuration'
                    });
                    defer.reject();
                } else {
                    defer.resolve(selectedConnector)
                }
            });
            return defer.promise;
        }
    }
})();