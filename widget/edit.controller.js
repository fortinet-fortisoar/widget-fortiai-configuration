/* Copyright start
  MIT License
  Copyright (c) 2024 Fortinet Inc
  Copyright end */

'use strict';
(function () {
    angular
        .module('cybersponse')
        .controller('editFortiAIConfiguration100Ctrl', editFortiAIConfiguration100Ctrl);

    editFortiAIConfiguration100Ctrl.$inject = ['$scope', '$uibModalInstance', 'config'];

    function editFortiAIConfiguration100Ctrl($scope, $uibModalInstance, config) {
        $scope.cancel = cancel;
        $scope.save = save;
        $scope.config = config;

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

        function save() {
            $uibModalInstance.close($scope.config);
        }

    }
})();
