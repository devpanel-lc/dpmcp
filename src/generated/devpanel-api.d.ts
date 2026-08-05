// GENERATED FILE — run `npm run generate:api`. Do not edit by hand.
export interface paths {
    "/api/v2/healthz": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AppController_healthCheck"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/extend-application": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AppController_extendApplication"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/metrics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AppController_metrics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/activities/{id}/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ActivitiesController_getLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ActivitiesController_listActivities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/activities/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ActivitiesController_readActivity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/clouds/aws/cloud-formation/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CloudsController_callBackCreateAIMRole"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/clouds/aws/marketplace/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["CloudsController_callBackMarketPlace"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["NotificationsController_getAllNotificationsByUserId"];
        put?: never;
        post: operations["NotificationsController_createNotifications"];
        delete: operations["NotificationsController_deleteAllNotifications"];
        options?: never;
        head?: never;
        patch: operations["NotificationsController_updateNotifications"];
        trace?: never;
    };
    "/api/v2/notifications/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["NotificationsController_getNotificationsById"];
        put?: never;
        post?: never;
        delete: operations["NotificationsController_deleteNotificationsById"];
        options?: never;
        head?: never;
        patch: operations["NotificationsController_updateNotificationById"];
        trace?: never;
    };
    "/api/v2/users/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_getProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["UserController_updateProfile"];
        trace?: never;
    };
    "/api/v2/users/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["UserController_logout"];
        trace?: never;
    };
    "/api/v2/users/cloud-accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_searchCloudAccount"];
        put?: never;
        post: operations["UserController_createCloudAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/cloud-accounts/{cloudAccountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["UserController_deleteCloudAccount"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/{id}/workspaces": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_searchWorkspacesOfUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/git-owners": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_searchGitOwners"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/repositories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_searchRepositories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/repositories/{repoName}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_getRepositories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/repositories/{repoName}/{repoId}/branches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_searchBranches"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/secrets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["UserController_updateUserSecrets"];
        trace?: never;
    };
    "/api/v2/users/gitToken": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["UserController_removePersonalToken"];
        options?: never;
        head?: never;
        patch: operations["UserController_updatePersonalToken"];
        trace?: never;
    };
    "/api/v2/users/command-access-token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_getCommandToken"];
        put?: never;
        post: operations["UserController_createCommandToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/command-access-token/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["UserController_deleteCommandToken"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/change-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["UserController_changePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_getMembers"];
        put?: never;
        post: operations["UserController_createMember"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/members/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["UserController_deleteMembers"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/administrators": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UserController_getAdministrators"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/users/administrators/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["UserController_deleteAdministrators"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/aws-orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AwsOrdersController_listAwsOrders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/aws-orders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AwsOrdersController_readAwsOrder"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/aws-orders/{id}/metering-record": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AwsOrdersController_listMeteringOrderRecords"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_getFilterWorkspaces"];
        put?: never;
        post: operations["WorkspacesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/members/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_getFilterWorkspacesByUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/single-node": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["WorkspacesController_createSingleNode"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/default": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["WorkspacesController_createDefaultWorkspace"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/forge-spot": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_getForgeSpotWp"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_detail"];
        put: operations["WorkspacesController_updateWorkspace"];
        post?: never;
        delete: operations["WorkspacesController_deleteWorkspace"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_listApplicationsOfWorkspace"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/deployments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_listDeploymentsOfWorkspace"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/logo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["WorkspacesController_updateWorkspaceLogo"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/pods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_getPodsOfWorkspace"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/activities/{activityId}/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_getLogsActivity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/activities/{activityId}/close-log": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["WorkspacesController_closeLogActivity"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_getMembersOfWorkspace"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/users/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["WorkspacesController_deleteMemberOfWorkspace"];
        options?: never;
        head?: never;
        patch: operations["WorkspacesController_updateMemberOfWorkspace"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/catalogs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_filterCatalogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/catalogs-drupalforge": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WorkspacesController_filterDFCatalogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProjectsController_getProjects"];
        put?: never;
        post: operations["ProjectsController_createProject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProjectsController_getProjectDetail"];
        put: operations["ProjectsController_updateProject"];
        post?: never;
        delete: operations["ProjectsController_deleteProject"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/resources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProjectsController_getProjectResource"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/quickstart/{catalogId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ProjectsController_quickStart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/quickclone/{catalogId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ProjectsController_quickClone"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/migrate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ProjectsController_migrateProject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/registry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ProjectsController_addRegistrySecret"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/base-registry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ProjectsController_addBaseRegistrySecret"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProjectsController_getMembersOfProject"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/users/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["ProjectsController_deleteMemberOfWorkspace"];
        options?: never;
        head?: never;
        patch: operations["ProjectsController_updateMemberOfProject"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/vscode-extensions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ProjectsController_setVSCodeExtensions"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/secret-managers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProjectsController_getVariables"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/secret-managers/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProjectsController_getVariablesByName"];
        put?: never;
        post: operations["ProjectsController_addVariables"];
        delete: operations["ProjectsController_deleteVariablesByName"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_getApplications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_getApplicationDetail"];
        put?: never;
        post?: never;
        delete: operations["ApplicationsController_deleteApplication"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/update": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ApplicationsController_upgradeApplication"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/pods/{podName}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["ApplicationsController_restartPod"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/pause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["ApplicationsController_pauseApplication"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/expired-time": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["ApplicationsController_expandExpiredTime"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ApplicationsController_updateAppState"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/advance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ApplicationsController_updateAdvanceApp"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/activate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ApplicationsController_activateApplication"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ApplicationsController_deactivateApplication"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/deploy-to-server": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ApplicationsController_deployToServer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/request-vscode-session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_getVscodeToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/request-pma-session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_getPMAToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/force-https": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["ApplicationsController_forceHTTPS"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/http-logs/{containerName}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_getHttpApplicationLog"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ApplicationsController_postActivities"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups/{backupId}/files/{fileId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_getFileDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_listBackup"];
        put?: never;
        post: operations["ApplicationsController_addBackup"];
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ApplicationsController_updateAutoDailyBackup"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups/{backupId}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ApplicationsController_restoreApplication"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups/{backupId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["ApplicationsController_deleteBackup"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/domains": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ApplicationsController_addCustomDomain"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_getMemberOfApplication"];
        put?: never;
        post: operations["ApplicationsController_addMemberOfApplication"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/users/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["ApplicationsController_deleteMemberOfApplication"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ApplicationsController_exportToTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DeploymentsController_listDeployments"];
        put?: never;
        post: operations["DeploymentsController_createDeployment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DeploymentsController_getDeployment"];
        put?: never;
        post?: never;
        delete: operations["DeploymentsController_deleteDeployment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/pods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DeploymentsController_getDeploymentDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/activate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["DeploymentsController_activateDeployment"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/configuration": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["DeploymentsController_updateDeploymentConfiguration"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/security": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["DeploymentsController_updateDeploymentSecurity"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/blue-green": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["DeploymentsController_createBGDeployment"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["DeploymentsController_deactivateDeployment"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/backups/{backupId}/files/{fileId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DeploymentsController_getFileDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/backups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DeploymentsController_listBackup"];
        put?: never;
        post: operations["DeploymentsController_addBackup"];
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["DeploymentsController_updateAutoDailyBackup"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/backups/{backupId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["DeploymentsController_deleteBackup"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/domains": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DeploymentsController_getCustomDomain"];
        put?: never;
        post: operations["DeploymentsController_addCustomDomain"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/force-https": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["DeploymentsController_forceHTTPS"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/request-pma-session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DeploymentsController_getPMAToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/green": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["DeploymentsController_createGreenDeployment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/deployments/{deploymentId}/switch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["DeploymentsController_switchOverDeployment"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/domains": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DomainsController_listDomains"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/domains/{domainId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["DomainsController_deleteCustomDomain"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/vps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["VpsController_getFilterVPS"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/vps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["VpsController_getFilterVPSByApplication"];
        put?: never;
        post: operations["VpsController_createVPS"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/vps/{vpsId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["VpsController_updateVPSById"];
        post?: never;
        delete: operations["VpsController_deleteVPSById"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/invite-link": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvitationsController_getInviteToWorkspaceLink"];
        put?: never;
        post?: never;
        delete: operations["InvitationsController_deleteInviteToWorkspaceLink"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/refresh-token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["InvitationsController_refreshWorkspaceInviteToken"];
        trace?: never;
    };
    "/api/v2/workspaces/token/list": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvitationsController_search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/token/{tokenId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvitationsController_getTokenDetail"];
        put?: never;
        post: operations["InvitationsController_createRbacByToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvitationsController_getWorkspaceInvitations"];
        put?: never;
        post: operations["InvitationsController_createWorkspaceInvitation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/invitations/{inviteId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["InvitationsController_deleteWorkspaceInvitation"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/transfer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["InvitationsController_transferWorkspace"];
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["InvitationsController_revokeTransfer"];
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvitationsController_getProjectInvitations"];
        put?: never;
        post: operations["InvitationsController_createProjectInvitation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workspaces/{workspaceId}/projects/{projectId}/invitations/{inviteId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["InvitationsController_deleteProjectInvitation"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProjectsController_listProjects"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/projects/{id}/branches/{branch}/configuration/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProjectsController_validateConfigFile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/projects/{id}/branches/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["ProjectsController_syncAllBranches"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/projects/{id}/update-project-repository": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["ProjectsController_updateProjectReporitory"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/projects/project-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProjectsController_getProjectTypes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_listApplications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/applications/{id}/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_listApplicationActivities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/applications/capacities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_listCapacities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/applications/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApplicationsController_detail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/applications/{id}/statics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StaticsController_listStaticSiteOfApplications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/applications/{id}/statics/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["StaticsController_getStaticSiteOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/applications/{id}/statics/quantcdn": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["StaticsController_createStaticSiteWithQuantCdn"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/applications/{id}/statics/quantcdn/domains": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a list of custom domain of static site */
        get: operations["StaticsController_getQuantCdnCustomDomain"];
        put?: never;
        /** Add new custom domain */
        post: operations["StaticsController_createQuantCdnCustomDomain"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/applications/{id}/statics/quantcdn/domains/{domainId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete custom domain */
        delete: operations["StaticsController_deleteQuantCdnCustomDomain"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/snapshots/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SnapshotsController_getSnapshotDetail"];
        put?: never;
        post?: never;
        delete: operations["SnapshotsController_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/catalogs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogsController_search"];
        put?: never;
        post: operations["CatalogsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/catalogs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogsController_getCatalogById"];
        put?: never;
        post?: never;
        delete: operations["CatalogsController_deleteCatalogById"];
        options?: never;
        head?: never;
        patch: operations["CatalogsController_updateCatalog"];
        trace?: never;
    };
    "/api/v2/catalogs/{id}/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["CatalogsController_adminUpdateCatalog"];
        trace?: never;
    };
    "/api/v2/catalogs/{repoName}/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CatalogsController_validateCatalog"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/teams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TeamsController_list"];
        put?: never;
        post: operations["TeamsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/teams/{teamId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TeamsController_getById"];
        put?: never;
        post?: never;
        delete: operations["TeamsController_delete"];
        options?: never;
        head?: never;
        patch: operations["TeamsController_update"];
        trace?: never;
    };
    "/api/v2/teams/{teamId}/repos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TeamsController_getGithubRepos"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/teams/{teamId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TeamsController_getMembers"];
        put?: never;
        post: operations["TeamsController_addMember"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/teams/{teamId}/members/{memberId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["TeamsController_deleteMember"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/resources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ResourcesController_getFilterResources"];
        put?: never;
        post: operations["ResourcesController_createResource"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/resources/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["ResourcesController_deleteResource"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/secrets/{projectId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SecretsController_getListByProjectId"];
        put?: never;
        post: operations["SecretsController_createSecretSet"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/secrets/{projectId}/set/{setId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["SecretsController_getListBySetId"];
        put?: never;
        post?: never;
        delete: operations["SecretsController_deleteSecreteSet"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvitesController_searchInvite"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/invitations/{userId}/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvitesController_getInvitations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/invitations/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvitesController_getInviteToken"];
        put?: never;
        post?: never;
        delete: operations["InvitesController_rejectInviteToken"];
        options?: never;
        head?: never;
        patch: operations["InvitesController_acceptInviteToken"];
        trace?: never;
    };
    "/api/v2/invitations/{inviteId}/verify-transfer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["InvitesController_acceptTransfer"];
        trace?: never;
    };
    "/api/v2/environments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_getById"];
        put: operations["EnvironmentsController_updateEnvironment"];
        post?: never;
        delete: operations["EnvironmentsController_deactivateEnvironment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/activities/{activityId}/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_getLogsActivity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_createReports"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/nodes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_getNodesReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/pods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_getPodsReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/namespaces": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_getNamespacesReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/workspaces": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_getWorkspacesReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/pvc": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_getPVCsReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/pv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EnvironmentsController_getPVsReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["EnvironmentsController_forceRemoveEnvironment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/environments/{environmentId}/activities/{activityId}/close-log": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["EnvironmentsController_closeLogActivity"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/github": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GithubOauthController_githubAuth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/github/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GithubOauthController_githubAuthCallback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/gitlab": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GitlabOauthController_gitlabAuth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/gitlab/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["GitlabOauthController_gitlabAuthCallback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/bitbucket": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["BitbucketOauthController_githubAuth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/bitbucket/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["BitbucketOauthController_bitbucketAuthCallback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/drupalcode": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DrupalcodeOauthController_drupalcodeAuth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/drupalcode/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["DrupalcodeOauthController_drupalcodeAuthCallback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/activities/{activityId}/notify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["WebhooksController_notifyTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/applications/{appId}/command": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["WebhooksController_triggerCommandApp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/applications/{appId}/git": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["WebhooksController_triggerApplicationGitHook"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/vps/{vpsId}/git": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["WebhooksController_triggerVpsGitHook"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/fb_user_deletion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["WebhooksController_fbDataDeletion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/fb_deletion_status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WebhooksController_fbGetDataDeletion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/files/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["FileController_uploadFile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List applications */
        get: operations["DrupalForgeController_listDFApplication"];
        put?: never;
        /** Express Launch application */
        post: operations["DrupalForgeController_quickStart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/applications/{applicationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get application detail by application Id */
        get: operations["DrupalForgeController_getApplicationById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/submissions/{submissionId}/application": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get application detail by submission Id */
        get: operations["DrupalForgeController_getApplication"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/submissions/{submissionId}/widget": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get application detail for the widget */
        get: operations["DrupalForgeController_getDFApplication"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/submissions/{submissionId}/extend-time": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Extend expiration time */
        patch: operations["DrupalForgeController_extendApplication"];
        trace?: never;
    };
    "/api/v2/drupal-forge/submissions/{submissionId}/save": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Assign application for user */
        post: operations["DrupalForgeController_saveApplication"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/applications/{applicationId}/check-for-selling": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Check application before selling [*] */
        get: operations["DrupalForgeController_applicationCheckForPayment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/applications/{applicationId}/purchase": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Purchase application [*] */
        patch: operations["DrupalForgeController_applicationExtend"];
        trace?: never;
    };
    "/api/v2/drupal-forge/applications/{applicationId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Cancel subscription application */
        patch: operations["DrupalForgeController_applicationCancellation"];
        trace?: never;
    };
    "/api/v2/drupal-forge/applications/{applicationId}/github": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Invite Github username to a paid app */
        post: operations["DrupalForgeController_inviteGithubUsername"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/applications/{applicationId}/unpause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Unpause application */
        patch: operations["DrupalForgeController_unpauseApp"];
        trace?: never;
    };
    "/api/v2/drupal-forge/applications/{applicationId}/deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Deactivated application */
        patch: operations["DrupalForgeController_deleteApplication"];
        trace?: never;
    };
    "/api/v2/drupal-forge/catalogs/{catalogId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Namespace for template */
        patch: operations["DrupalForgeController_updateTemplate"];
        trace?: never;
    };
    "/api/v2/drupal-forge/admin/pause-template": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Forge pause application */
        post: operations["DrupalForgeController_adminPauseTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/admin/deactivate-template": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Forge deactivate application */
        post: operations["DrupalForgeController_adminDeactivateTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/lambda/{templateId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Lambda Increase a host instance */
        post: operations["DrupalForgeController_lambdaIncreaseTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/catalogs/{templateId}/express-launch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Count host instances */
        get: operations["DrupalForgeController_countTemplate"];
        put?: never;
        /** Increase a host instance */
        post: operations["DrupalForgeController_increaseQuickStartTemplate"];
        /** Decrease a host instance */
        delete: operations["DrupalForgeController_decreaseQuickStartTemplate"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/drupal-forge/drupalpod/new": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a DrupalPod application */
        post: operations["DrupalForgeController_createDrupalPod"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/hosted-zones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HostedZonesController_filter"];
        put?: never;
        post: operations["HostedZonesController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/hosted-zones/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["HostedZonesController_deleteId"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/decoupled-io/spaces/{spaceId}/applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List applications */
        get: operations["DecoupledIOController_listDioApps"];
        put?: never;
        /** Express Launch application */
        post: operations["DecoupledIOController_quickStart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/decoupled-io/spaces/{spaceId}/applications/{applicationId}/clone": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Clone application */
        patch: operations["DecoupledIOController_cloneDioApp"];
        trace?: never;
    };
    "/api/v2/decoupled-io/spaces/{spaceId}/applications/{applicationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get application detail */
        get: operations["DecoupledIOController_getApplicationById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/decoupled-io/spaces/{spaceId}/applications/{applicationId}/extend-time": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Extend expiration time */
        patch: operations["DecoupledIOController_extendApplication"];
        trace?: never;
    };
    "/api/v2/decoupled-io/spaces/{spaceId}/applications/{applicationId}/pause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Pause application */
        patch: operations["DecoupledIOController_pauseApp"];
        trace?: never;
    };
    "/api/v2/decoupled-io/spaces/{spaceId}/applications/{applicationId}/unpause": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Unpause application */
        patch: operations["DecoupledIOController_unpauseApp"];
        trace?: never;
    };
    "/api/v2/decoupled-io/spaces/{spaceId}/applications/{applicationId}/deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Deactivated application */
        patch: operations["DecoupledIOController_deleteApplication"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AddNotificationsDTO: Record<string, never>;
        UpdateNotificationDTO: Record<string, never>;
        UpdateProfileDTO: {
            search?: string;
            /** @default 1 */
            pageIndex: number;
            /** @default 12 */
            pageSize: number;
            displayName: string;
            avatarUrl: string;
            state: string;
        };
        CreateCloudAccountDTO: {
            name: string;
            provider: string;
            desc?: string;
            awsArnRole: string;
            doToken: string;
            doSpaceRegion: string;
            doSpaceKey: string;
            doSpaceSecret: string;
            azSubscriptionId: string;
            azTenantId: string;
            azClientId: string;
            azClientSecret: string;
            ovhEndpoint: string;
            ovhAppKey: string;
            ovhAppSecretKey: string;
            ovhConsumerKey: string;
            ovhProjectKey: string;
        };
        UpdateUserSecret: Record<string, never>;
        UpdatePersonalTokenDTO: Record<string, never>;
        RemovePersonalTokenDTO: Record<string, never>;
        CognitoUserChangePasswordDTO: {
            username: string;
            password: string;
            confirmPassword: string;
        };
        CreateCognitoUserDTO: {
            username: string;
            password: string;
        };
        CreateWorkspaceDTO: Record<string, never>;
        UpdateWorkspaceDTO: Record<string, never>;
        CreateProjectDTO: {
            repositoryId?: string;
            repositoryOwner?: string;
            repositoryName?: string;
            projectType?: string;
            repositoryType?: string;
            instances?: string[];
            repositoryProvider: string;
            /** @default false */
            isUsePersonalToken: boolean;
            /** @default false */
            isUseRepositoryToken: boolean;
            /** @default  */
            repositoryToken: string;
        };
        QuickstartDTO: {
            repositoryId?: string;
            repositoryOwner?: string;
            repositoryName?: string;
            projectType?: string;
            repositoryType?: string;
            instances?: string[];
            repositoryProvider: string;
            /** @default false */
            isUsePersonalToken: boolean;
            /** @default false */
            isUseRepositoryToken: boolean;
            /** @default  */
            repositoryToken: string;
        };
        CloneFromCatalogDTO: {
            name: string;
            repositoryOwner: string;
            repositoryName: string;
            repositoryProvider: string;
            /** @default false */
            isUsePersonalToken: boolean;
        };
        MigrateProjectDTO: {
            name: string;
            platformMigrationType: string;
            projectType?: string;
            pantheonMachineToken?: string;
            pantheonSiteId?: string;
            pantheonEnv?: string;
            repositoryProvider: string;
            repositoryType?: string;
            /** @default false */
            isUsePersonalToken: boolean;
            repositoryId?: string;
            repositoryOwner?: string;
            repositoryName?: string;
        };
        AddRegistrySecretDTO: {
            workspaceId: string;
            projectId: string;
            registryProvider: string;
            registryServer: string;
            registryUsername: string;
            registryToken: string;
        };
        AddBaseRegistrySecretDTO: {
            workspaceId: string;
            projectId: string;
            baseRegistryProvider: string;
            baseRegistryUsername: string;
            baseRegistryToken: string;
            baseRegistryServer: string;
            baseRegistryTags: string[];
        };
        AddVariablesDTO: {
            name: string;
            values: Record<string, never>;
        };
        UpgradeApplicationDTO: Record<string, never>;
        ApplicationReplicasDTO: Record<string, never>;
        UpdateApplicationStateDTO: Record<string, never>;
        UpdateAdvanceApp: Record<string, never>;
        ActivateLAMAppDTO: Record<string, never>;
        DeactivateLAMAppDTO: Record<string, never>;
        DeployToServerDTO: Record<string, never>;
        ForcingHttpsDTO: Record<string, never>;
        CreateFrontendActivitiesDTO: Record<string, never>;
        CreateBackupDTO: {
            /** @enum {string} */
            type: "MANUAL" | "AUTOMATED";
        };
        AutoBackupDTO: Record<string, never>;
        CreateDomainDTO: Record<string, never>;
        ExportToTemplateDTO: Record<string, never>;
        ActivateDeploymentDTO: Record<string, never>;
        DeploymentConfigurationDTO: Record<string, never>;
        DeploymentSecurityDTO: Record<string, never>;
        CreateDeploymentDomainDTO: Record<string, never>;
        ForcingDeploymentHttpsDTO: Record<string, never>;
        CreateVPSDTO: Record<string, never>;
        UpdateVpsDTO: Record<string, never>;
        CreateInviteDTO: {
            search?: string;
            /** @default 1 */
            pageIndex: number;
            /** @default 12 */
            pageSize: number;
        };
        SyncBranchesDTO: Record<string, never>;
        UpdateProjectRepositoryDTO: {
            /** @default false */
            isUsePersonalToken: boolean;
            /** @default false */
            isUseRepositoryToken: boolean;
            /** @default  */
            repositoryToken: string;
        };
        CreateDomainQuantCdnDto: {
            domain: string;
        };
        Catalog: Record<string, never>;
        UpsertTeamDTO: Record<string, never>;
        AddSecretsDTO: {
            name: string;
            values: Record<string, never>;
        };
        VerifyInviteDTO: {
            search?: string;
            /** @default 1 */
            pageIndex: number;
            /** @default 12 */
            pageSize: number;
        };
        TaskCallBackBodyDTO: Record<string, never>;
        TriggerWebhookAppDTO: Record<string, never>;
        TriggerWebhookVpsDTO: Record<string, never>;
        ExtendDFApplicationDTO: {
            /** @description Submission Id */
            submissionId: string;
            /** @description User email */
            email?: string;
            /** @description Enable Cloud Dev Environment (Code-Server) */
            isEnableEditor: boolean;
        };
        SaveDFApplicationDTO: {
            /** @description Submission Id */
            submissionId: string;
            /** @description User email */
            email: string;
            /** @description Enable Cloud Dev Environment (Code-Server) */
            isEnableEditor: boolean;
        };
        CreateDFApplicationDTO: {
            /** @description Submission Id */
            submissionId: string;
            /** @description Template Id */
            templateId: string;
            /** @description User email */
            email?: string;
            /** @description Application Name */
            appName?: string;
            /** @description Enable Cloud Dev Environment (Code-Server) */
            isEnableEditor: boolean;
        };
        ExtendPaymentAppDTO: {
            /** @description DevPanel applicationId */
            applicationId: string;
            /** @description Subscription end time */
            subscriptionEnded?: number;
            /** @description User email */
            email: string;
        };
        CancellationAppDTO: {
            /** @description DevPanel applicationId */
            applicationId: string;
            /** @description Subscription end time */
            subscriptionEnded?: number;
            /** @description User email */
            email: string;
        };
        InviteGithubDTO: {
            /** @description Github username */
            githubUsername: string;
        };
        DeactivateDFApplicationDTO: {
            /** @description Submission Id */
            submissionId: string;
            /** @description User email */
            email?: string;
        };
        UpdateDFCatalogDTO: {
            /** @description Namespace of a workspace */
            forgeSpotNamespace: string;
            /** @description User email */
            email: string;
        };
        CreateDrupalPodDTO: {
            /** @description DevPanel workspaceId */
            workspaceId?: string;
            /** @description Submission Id */
            submissionId: string;
            /**
             * @description ENV variables
             * @example DP_IMAGE=devpanel/drupal-9:develop,DP_APP_ROOT=/var/www/html,DP_WEB_ROOT=/var/www/html/web,DP_REPO_BRANCH=https://git.drupalcode.org/issue/drupalpod-3504317/-/tree/drupalforge,DP_RUN_SCRIPT=re-config.sh
             */
            envVariables: string;
            /** @description User email */
            email: string;
        };
        CreateHostedZoneApiDTO: {
            domain: string;
            isDrupalForge: boolean;
        };
        CreateDioAppDTO: {
            /** @description Template Id */
            templateId: string;
            /** @description User email */
            email?: string;
            /**
             * @description DecoupledIO Environment (dev | test | live)
             * @default dev
             */
            strategy: string;
        };
        CloneDioAppDTO: {
            /** @description User email */
            email: string;
            /**
             * @description DecoupledIO Environment (dev | test | live)
             * @default test
             */
            strategy: string;
        };
        ExtendDioAppDTO: {
            /** @description User email */
            email: string;
            /**
             * @description Extended hours
             * @default 1
             */
            extendedHours: number;
        };
        PauseDioAppDTO: {
            /** @description User email */
            email: string;
        };
        UnPauseDioAppDTO: {
            /** @description User email */
            email: string;
        };
        DeactivateDioAppDTO: {
            /** @description User email */
            email?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    AppController_healthCheck: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AppController_extendApplication: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AppController_metrics: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ActivitiesController_getLogs: {
        parameters: {
            query?: {
                pageSize?: number;
                sinceSeconds?: number;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ActivitiesController_listActivities: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ActivitiesController_readActivity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CloudsController_callBackCreateAIMRole: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CloudsController_callBackMarketPlace: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_getAllNotificationsByUserId: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_createNotifications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddNotificationsDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_deleteAllNotifications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_updateNotifications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateNotificationDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_getNotificationsById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_deleteNotificationsById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    NotificationsController_updateNotificationById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateNotificationDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_updateProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_searchCloudAccount: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_createCloudAccount: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCloudAccountDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_deleteCloudAccount: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                cloudAccountId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_searchWorkspacesOfUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_searchGitOwners: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_searchRepositories: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_getRepositories: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                repoName: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_searchBranches: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                repoName: string;
                repoId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_updateUserSecrets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserSecret"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_removePersonalToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RemovePersonalTokenDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_updatePersonalToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdatePersonalTokenDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_getCommandToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_createCommandToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_deleteCommandToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_changePassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CognitoUserChangePasswordDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_getMembers: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_createMember: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCognitoUserDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_deleteMembers: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_getAdministrators: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UserController_deleteAdministrators: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AwsOrdersController_listAwsOrders: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AwsOrdersController_readAwsOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AwsOrdersController_listMeteringOrderRecords: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                awsOrderId: string;
                sortField: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_getFilterWorkspaces: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWorkspaceDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_getFilterWorkspacesByUser: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path: {
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_createSingleNode: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWorkspaceDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_createDefaultWorkspace: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_getForgeSpotWp: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_updateWorkspace: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateWorkspaceDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_deleteWorkspace: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_listApplicationsOfWorkspace: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                projectId?: string;
                environmentId?: string;
                namespace?: string;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_listDeploymentsOfWorkspace: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                projectId?: string;
                workspaceId?: string;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_updateWorkspaceLogo: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_getPodsOfWorkspace: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
                workspaceId: string;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_getLogsActivity: {
        parameters: {
            query?: {
                pageSize?: number;
                sinceSeconds?: number;
            };
            header?: never;
            path: {
                workspaceId: string;
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_closeLogActivity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_getMembersOfWorkspace: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
                workspaceId: string;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_deleteMemberOfWorkspace: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_updateMemberOfWorkspace: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_filterCatalogs: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WorkspacesController_filterDFCatalogs: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_getProjects: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
                projectTypeId: string;
                workspaceId: string;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_createProject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateProjectDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_getProjectDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_updateProject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_deleteProject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_getProjectResource: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_quickStart: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                catalogId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuickstartDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_quickClone: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                catalogId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CloneFromCatalogDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_migrateProject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MigrateProjectDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_addRegistrySecret: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddRegistrySecretDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_addBaseRegistrySecret: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddBaseRegistrySecretDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_getMembersOfProject: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
                workspaceId: string;
                projectId: string;
            };
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_deleteMemberOfWorkspace: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_updateMemberOfProject: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_setVSCodeExtensions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_getVariables: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_getVariablesByName: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_addVariables: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                name: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddVariablesDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_deleteVariablesByName: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_getApplications: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                projectId?: string;
                environmentId?: string;
                namespace?: string;
            };
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_getApplicationDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_deleteApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_upgradeApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpgradeApplicationDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_restartPod: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                podName: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_pauseApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApplicationReplicasDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_expandExpiredTime: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_updateAppState: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateApplicationStateDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_updateAdvanceApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateAdvanceApp"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_activateApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActivateLAMAppDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_deactivateApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeactivateLAMAppDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_deployToServer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeployToServerDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_getVscodeToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_getPMAToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_forceHTTPS: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ForcingHttpsDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_getHttpApplicationLog: {
        parameters: {
            query?: {
                pageSize?: number;
                sinceSeconds?: number;
            };
            header?: never;
            path: {
                applicationId: string;
                containerName: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_postActivities: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateFrontendActivitiesDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_getFileDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
                backupId: string;
                fileId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_listBackup: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_addBackup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateBackupDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_updateAutoDailyBackup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AutoBackupDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_restoreApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
                backupId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_deleteBackup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
                projectId: string;
                workspaceId: string;
                backupId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_addCustomDomain: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDomainDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_getMemberOfApplication: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
                applicationId: string;
            };
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_addMemberOfApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_deleteMemberOfApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_exportToTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExportToTemplateDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_listDeployments: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_createDeployment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_getDeployment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_deleteDeployment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_getDeploymentDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_activateDeployment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActivateDeploymentDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_updateDeploymentConfiguration: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeploymentConfigurationDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_updateDeploymentSecurity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeploymentSecurityDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_createBGDeployment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActivateDeploymentDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_deactivateDeployment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_getFileDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
                backupId: string;
                fileId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_listBackup: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_addBackup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateBackupDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_updateAutoDailyBackup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AutoBackupDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_deleteBackup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
                projectId: string;
                workspaceId: string;
                backupId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_getCustomDomain: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_addCustomDomain: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDeploymentDomainDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_forceHTTPS: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ForcingDeploymentHttpsDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_getPMAToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_createGreenDeployment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DeploymentsController_switchOverDeployment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
                deploymentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DomainsController_listDomains: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DomainsController_deleteCustomDomain: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                domainId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    VpsController_getFilterVPS: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    VpsController_getFilterVPSByApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    VpsController_createVPS: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateVPSDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    VpsController_updateVPSById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vpsId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateVpsDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    VpsController_deleteVPSById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vpsId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_getInviteToWorkspaceLink: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_deleteInviteToWorkspaceLink: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_refreshWorkspaceInviteToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_search: {
        parameters: {
            query: {
                token: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_getTokenDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                tokenId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_createRbacByToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                tokenId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_getWorkspaceInvitations: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_createWorkspaceInvitation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateInviteDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_deleteWorkspaceInvitation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                inviteId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_transferWorkspace: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_revokeTransfer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_getProjectInvitations: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_createProjectInvitation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                workspaceId: string;
                projectId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateInviteDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitationsController_deleteProjectInvitation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                inviteId: string;
                projectId: string;
                workspaceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_listProjects: {
        parameters: {
            query: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                sortField: string;
                projectTypeId: string;
                workspaceId: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_validateConfigFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                branch: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_syncAllBranches: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SyncBranchesDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_updateProjectReporitory: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProjectRepositoryDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProjectsController_getProjectTypes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_listApplications: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
                projectId?: string;
                environmentId?: string;
                namespace?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_listApplicationActivities: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_listCapacities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApplicationsController_detail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaticsController_listStaticSiteOfApplications: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The application id */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaticsController_getStaticSiteOverview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The application id */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaticsController_createStaticSiteWithQuantCdn: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The application id */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaticsController_getQuantCdnCustomDomain: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The application id */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaticsController_createQuantCdnCustomDomain: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The application id */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDomainQuantCdnDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    StaticsController_deleteQuantCdnCustomDomain: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The custom domain id */
                domainId: unknown;
                /** @description The application id */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SnapshotsController_getSnapshotDetail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SnapshotsController_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CatalogsController_search: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CatalogsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Catalog"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CatalogsController_getCatalogById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CatalogsController_deleteCatalogById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CatalogsController_updateCatalog: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Catalog"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CatalogsController_adminUpdateCatalog: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Catalog"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CatalogsController_validateCatalog: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                repoName: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TeamsController_list: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TeamsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertTeamDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TeamsController_getById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                teamId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TeamsController_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                teamId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TeamsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                teamId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertTeamDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TeamsController_getGithubRepos: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                teamId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TeamsController_getMembers: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                teamId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TeamsController_addMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                teamId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TeamsController_deleteMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                teamId: string;
                memberId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourcesController_getFilterResources: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourcesController_createResource: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ResourcesController_deleteResource: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SecretsController_getListByProjectId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SecretsController_createSecretSet: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddSecretsDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SecretsController_getListBySetId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                setId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SecretsController_deleteSecreteSet: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                projectId: string;
                setId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitesController_searchInvite: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitesController_getInvitations: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitesController_getInviteToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitesController_rejectInviteToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitesController_acceptInviteToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    InvitesController_acceptTransfer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                inviteId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyInviteDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_search: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_getById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_updateEnvironment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_deactivateEnvironment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_getLogsActivity: {
        parameters: {
            query?: {
                pageSize?: number;
                sinceSeconds?: number;
            };
            header?: never;
            path: {
                environmentId: string;
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_createReports: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_getNodesReport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_getPodsReport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_getNamespacesReport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_getWorkspacesReport: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_getPVCsReport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_getPVsReport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_forceRemoveEnvironment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                environmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EnvironmentsController_closeLogActivity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GithubOauthController_githubAuth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GithubOauthController_githubAuthCallback: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GitlabOauthController_gitlabAuth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    GitlabOauthController_gitlabAuthCallback: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BitbucketOauthController_githubAuth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BitbucketOauthController_bitbucketAuthCallback: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DrupalcodeOauthController_drupalcodeAuth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DrupalcodeOauthController_drupalcodeAuthCallback: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_notifyTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskCallBackBodyDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_triggerCommandApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_triggerApplicationGitHook: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TriggerWebhookAppDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_triggerVpsGitHook: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vpsId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TriggerWebhookVpsDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_fbDataDeletion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_fbGetDataDeletion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    FileController_uploadFile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DrupalForgeController_listDFApplication: {
        parameters: {
            query: {
                pageIndex?: number;
                limit?: number;
                email: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Return total resource and list of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 5 */
                        total?: number;
                        /**
                         * @example [
                         *       {
                         *         "_id": "685a687709ec8e6d00d2508c",
                         *         "originBranch": "main",
                         *         "hostname": "prod-5dbd2809-00d25073-zm57vb0y.cms-devpanel.click",
                         *         "project": {
                         *           "_id": "685a687709ec8e6d00d25073",
                         *           "name": "Drupal 7-activated - abc@gmail.com",
                         *           "repoUrl": "https://github.com/drupalforge/drupal-11",
                         *           "workspace": {
                         *             "_id": "67b6a58e25fc56eb5dbd2809",
                         *             "name": "DrupalForge Apps",
                         *             "logo": "https://files.site.devpanel.com/file-1740023565621-file-1725646490575-DF Express Launch.png"
                         *           },
                         *           "catalog": {
                         *             "_id": "658bf48de5ae642f99e9b029",
                         *             "name": "Drupal 7",
                         *             "projectType": "drupal7_v2",
                         *             "repositoryVisibility": "public",
                         *             "team": {
                         *               "_id": "684fec687f34dd24ffcacda5",
                         *               "name": "DevPanel",
                         *               "logoImage": "https://files.site.devpanel.com/file-1750041236993-chamell_250x250.png",
                         *               "email": "services@devpanel.com",
                         *               "isVerified": true,
                         *               "color": "#fff"
                         *             }
                         *           }
                         *         },
                         *         "appRoot": "/var/www/html",
                         *         "webRoot": "/var/www/html",
                         *         "status": "DEPLOY_APPLICATION_SUCCESS",
                         *         "capacity": "small_1",
                         *         "capacityLimit": "small_1",
                         *         "groupType": "on-demand",
                         *         "storage": 3,
                         *         "filePermissionLevel": "looserPermission",
                         *         "editorPwd": "xxxx****xxxx",
                         *         "editorHostname": "cs-prod-5dbd2809-00d25073-zm57vb0y.cms-devpanel.click",
                         *         "deployedAt": "2025-06-24T08:58:36.328Z",
                         *         "drupalForge": {
                         *           "submissionId": "1ef8ae22-95e3-401a-9bf3-ea28f794f7b2",
                         *           "isIncludeDev": false,
                         *           "isActive": false,
                         *           "email": "abc@gmail.com"
                         *         },
                         *         "expiredTime": 1750828527758,
                         *         "subscriptionEnded": 1750828527758
                         *       },
                         *       {
                         *         "_id": "68599fabb83c0c36ce211714",
                         *         "originBranch": "main",
                         *         "hostname": "prod-5dbd2809-ce211701-qt8eb3pl.cms-devpanel.click",
                         *         "project": {
                         *           "_id": "68599fabb83c0c36ce211701",
                         *           "name": "Drupal CMS-activated - abc@gmail.com",
                         *           "repoUrl": "https://github.com/drupalforge/drupal-11",
                         *           "workspace": {
                         *             "_id": "67b6a58e25fc56eb5dbd2809",
                         *             "name": "DrupalForge Apps",
                         *             "logo": "https://files.site.devpanel.com/file-1740023565621-file-1725646490575-DF Express Launch.png"
                         *           },
                         *           "catalog": {
                         *             "_id": "67d0f5d8de1d53c9ddf5f48b",
                         *             "name": "Drupal CMS",
                         *             "projectType": "drupal11_v2",
                         *             "repositoryVisibility": "private",
                         *             "team": {
                         *               "_id": "684fec8f7f34dd24ffcacdae",
                         *               "name": "DrupalForge",
                         *               "logoImage": "https://files.site.devpanel.com/file-1750042927121-drupal-forge.png",
                         *               "email": "services@drupalforge.org",
                         *               "isVerified": true,
                         *               "color": "#fff"
                         *             }
                         *           }
                         *         },
                         *         "appRoot": "/var/www/html",
                         *         "webRoot": "/var/www/html/web",
                         *         "status": "DEPLOY_APPLICATION_SUCCESS",
                         *         "capacity": "medium_1",
                         *         "capacityLimit": "medium_1",
                         *         "groupType": "on-demand",
                         *         "storage": 4,
                         *         "filePermissionLevel": "looserPermission",
                         *         "editorPwd": "xxxx****xxxx",
                         *         "editorHostname": "cs-prod-5dbd2809-ce211701-qt8eb3pl.cms-devpanel.click",
                         *         "deployedAt": "2025-06-23T18:42:09.065Z",
                         *         "drupalForge": {
                         *           "submissionId": "1ef8ae22-95e3-401a-9bf3-ea28f794f7b2",
                         *           "isIncludeDev": false,
                         *           "isActive": false,
                         *           "email": "abc@gmail.com"
                         *         },
                         *         "expiredTime": 1750828527758,
                         *         "subscriptionEnded": 1750828527758
                         *       }
                         *     ]
                         */
                        applications?: unknown[];
                    };
                };
            };
        };
    };
    DrupalForgeController_quickStart: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDFApplicationDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_getApplicationById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Return total resource and list of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 685a687709ec8e6d00d2508c */
                        _id?: string;
                        /** @example main */
                        originBranch?: string;
                        /** @example prod-5dbd2809-00d25073-zm57vb0y.cms-devpanel.click */
                        hostname?: string;
                        /**
                         * @example {
                         *       "_id": "685a687709ec8e6d00d25073",
                         *       "name": "Drupal 7-activated - abc@gmail.com",
                         *       "repoUrl": "https://github.com/drupalforge/drupal-11",
                         *       "workspace": {
                         *         "_id": "67b6a58e25fc56eb5dbd2809",
                         *         "name": "DrupalForge Apps",
                         *         "logo": "https://files.site.devpanel.com/file-1740023565621-file-1725646490575-DF Express Launch.png"
                         *       },
                         *       "catalog": {
                         *         "_id": "658bf48de5ae642f99e9b029",
                         *         "name": "Drupal 7",
                         *         "projectType": "drupal7_v2",
                         *         "repositoryVisibility": "public",
                         *         "team": {
                         *           "_id": "684fec687f34dd24ffcacda5",
                         *           "name": "DevPanel",
                         *           "logoImage": "https://files.site.devpanel.com/file-1750041236993-chamell_250x250.png",
                         *           "email": "services@devpanel.com",
                         *           "isVerified": true,
                         *           "color": "#fff"
                         *         }
                         *       }
                         *     }
                         */
                        project?: Record<string, never>;
                        /** @example /var/www/html */
                        appRoot?: string;
                        /** @example /var/www/html */
                        webRoot?: string;
                        /** @example DEPLOY_APPLICATION_SUCCESS */
                        status?: string;
                        /** @example small_1 */
                        capacity?: string;
                        /** @example small_1 */
                        capacityLimit?: string;
                        /** @example on-demand */
                        groupType?: string;
                        /** @example 3 */
                        storage?: number;
                        /** @example looserPermission */
                        filePermissionLevel?: string;
                        /** @example xxxx****xxxx */
                        editorPwd?: string;
                        /** @example cs-prod-5dbd2809-00d25073-zm57vb0y.cms-devpanel.click */
                        editorHostname?: string;
                        /** @example 2025-06-24T08:58:36.328Z */
                        deployedAt?: string;
                        /**
                         * @example {
                         *       "submissionId": "1ef8ae22-95e3-401a-9bf3-ea28f794f7b2",
                         *       "isIncludeDev": false,
                         *       "isActive": false,
                         *       "email": "abc@gmail.com"
                         *     }
                         */
                        drupalForge?: Record<string, never>;
                        /** @example 1750828527758 */
                        expiredTime?: number;
                        /** @example 1750828527758 */
                        subscriptionEnded?: number;
                    };
                };
            };
        };
    };
    DrupalForgeController_getApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submissionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Return total resource and list of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 685a687709ec8e6d00d2508c */
                        _id?: string;
                        /** @example main */
                        originBranch?: string;
                        /** @example prod-5dbd2809-00d25073-zm57vb0y.cms-devpanel.click */
                        hostname?: string;
                        /**
                         * @example {
                         *       "_id": "685a687709ec8e6d00d25073",
                         *       "name": "Drupal 7-activated - abc@gmail.com",
                         *       "repoUrl": "https://github.com/drupalforge/drupal-11",
                         *       "workspace": {
                         *         "_id": "67b6a58e25fc56eb5dbd2809",
                         *         "name": "DrupalForge Apps",
                         *         "logo": "https://files.site.devpanel.com/file-1740023565621-file-1725646490575-DF Express Launch.png"
                         *       },
                         *       "catalog": {
                         *         "_id": "658bf48de5ae642f99e9b029",
                         *         "name": "Drupal 7",
                         *         "projectType": "drupal7_v2",
                         *         "repositoryVisibility": "public",
                         *         "team": {
                         *           "_id": "684fec687f34dd24ffcacda5",
                         *           "name": "DevPanel",
                         *           "logoImage": "https://files.site.devpanel.com/file-1750041236993-chamell_250x250.png",
                         *           "email": "services@devpanel.com",
                         *           "isVerified": true,
                         *           "color": "#fff"
                         *         }
                         *       }
                         *     }
                         */
                        project?: Record<string, never>;
                        /** @example /var/www/html */
                        appRoot?: string;
                        /** @example /var/www/html */
                        webRoot?: string;
                        /** @example DEPLOY_APPLICATION_SUCCESS */
                        status?: string;
                        /** @example small_1 */
                        capacity?: string;
                        /** @example small_1 */
                        capacityLimit?: string;
                        /** @example on-demand */
                        groupType?: string;
                        /** @example 3 */
                        storage?: number;
                        /** @example looserPermission */
                        filePermissionLevel?: string;
                        /** @example xxxx****xxxx */
                        editorPwd?: string;
                        /** @example cs-prod-5dbd2809-00d25073-zm57vb0y.cms-devpanel.click */
                        editorHostname?: string;
                        /** @example 2025-06-24T08:58:36.328Z */
                        deployedAt?: string;
                        /**
                         * @example {
                         *       "submissionId": "1ef8ae22-95e3-401a-9bf3-ea28f794f7b2",
                         *       "isIncludeDev": false,
                         *       "isActive": false,
                         *       "email": "abc@gmail.com"
                         *     }
                         */
                        drupalForge?: Record<string, never>;
                        /** @example 1750828527758 */
                        expiredTime?: number;
                        /** @example 1750828527758 */
                        subscriptionEnded?: number;
                    };
                };
            };
        };
    };
    DrupalForgeController_getDFApplication: {
        parameters: {
            query?: {
                originUrl?: string;
            };
            header?: never;
            path: {
                submissionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Return total resource and list of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example https://staging.site.devpanel.com/workspaces/67b6a58e25fc56eb5dbd2809/projects/685a687709ec8e6d00d25073/applications/685a687709ec8e6d00d2508c/overview */
                        workspaceUrl?: string;
                        /** @example https://staging.site.devpanel.com/extend-application?token=VTJGc2RHVmtYMTlHekRNL1FtVzhvTEdyVmNtdWRkL3d2MWR3enBBSU9GWXA1Q1dUMWx3U2F1RVNoUEtWU2ZUeWFST2VnVnYvTWxPUytRMFY3bTdQN1F1UFBFTi9FVVZTS00yaHBxbkUyNDRyY1dkZ0tYbi9RcFlqcCtLbXJJSGdPeWx5YUovU28yVElJTnBQSzdyMjdhNVJIdzRIQ2hoN2xzOVNFclFyNHJjeUlCemFCMDh1YW4xZzN6VVNjZ0d0RFA4eHptcXRPYzZlQXNkOStuZlQ2QT09 */
                        extendTimeUrl?: string;
                        /** @example 685a687709ec8e6d00d2508c */
                        applicationId?: string;
                        /** @example https://prod-5dbd2809-00d25073-zm57vb0y.cms-devpanel.click */
                        applicationURL?: string;
                        /** @example https://cs-prod-5dbd2809-00d25073-zm57vb0y.cms-devpanel.click */
                        vscodeURL?: string;
                        /** @example https://prod-5dbd2809-00d25073-zm57vb0y.cms-devpanel.click/ */
                        loginUrl?: string;
                        /** @example xxxx****xxxx */
                        vscodePassword?: string;
                        /** @example private */
                        repositoryVisibility?: string;
                        /** @example devpanel */
                        username?: string;
                        /** @example devpanel */
                        password?: string;
                        /** @example 1750828527758 */
                        expiredTime?: number;
                        /** @example true */
                        isActive?: boolean;
                        /** @example true */
                        isIncludeDev?: boolean;
                        /** @example 1 */
                        replicas?: number;
                        /** @example DEPLOY_APPLICATION_SUCCESS */
                        status?: string;
                        /** @example 0.5CPU, 1GB RAM */
                        capacity?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_extendApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submissionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExtendDFApplicationDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_saveApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submissionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveDFApplicationDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_applicationCheckForPayment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_applicationExtend: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExtendPaymentAppDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_applicationCancellation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CancellationAppDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_inviteGithubUsername: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InviteGithubDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_unpauseApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_deleteApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeactivateDFApplicationDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_updateTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                catalogId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateDFCatalogDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    DrupalForgeController_adminPauseTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DrupalForgeController_adminDeactivateTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DrupalForgeController_lambdaIncreaseTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                templateId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DrupalForgeController_countTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                templateId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Number of the hot instances */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        ready?: number;
                        inprogress?: number;
                    };
                };
            };
        };
    };
    DrupalForgeController_increaseQuickStartTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                templateId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DrupalForgeController_decreaseQuickStartTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                templateId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DrupalForgeController_createDrupalPod: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDrupalPodDTO"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
        };
    };
    HostedZonesController_filter: {
        parameters: {
            query?: {
                search?: string;
                pageIndex?: number;
                pageSize?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HostedZonesController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateHostedZoneApiDTO"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HostedZonesController_deleteId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DecoupledIOController_listDioApps: {
        parameters: {
            query: {
                pageIndex?: number;
                limit?: number;
                /** @description User email */
                email: string;
            };
            header?: never;
            path: {
                spaceId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Return total results and list of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 5 */
                        total?: number;
                        /**
                         * @example [
                         *       {
                         *         "applicationId": "685a687709ec8e6d00d2508c",
                         *         "applicationURL": "https://domain.apps.decoupled.io",
                         *         "vscodeURL": "https://cs-domain.apps.decoupled.io",
                         *         "vscodePassword": "xxxx****xxxx",
                         *         "expiredTime": "1750828527758",
                         *         "isActive": true,
                         *         "status": "DEPLOY_APPLICATION_SUCCESS",
                         *         "capacity": "0.5CPU, 1GB RAM",
                         *         "email": "abc@gmail.com",
                         *         "spaceId": 777,
                         *         "strategy": "dev"
                         *       },
                         *       {
                         *         "applicationId": "675a687709ec8e6d00d2508b",
                         *         "applicationURL": "https://main.apps.decoupled.io",
                         *         "vscodeURL": "https://cs-main.apps.decoupled.io",
                         *         "vscodePassword": "xxxx**$**xxxx",
                         *         "expiredTime": "1750828527759",
                         *         "isActive": true,
                         *         "status": "DEPLOY_APPLICATION_SUCCESS",
                         *         "capacity": "0.5CPU, 1GB RAM",
                         *         "email": "abc@gmail.com",
                         *         "spaceId": 777,
                         *         "strategy": "test"
                         *       },
                         *       {
                         *         "applicationId": "679a687709ec8e6d00d250b9",
                         *         "applicationURL": "https://live.apps.decoupled.io",
                         *         "vscodeURL": "https://cs-live.apps.decoupled.io",
                         *         "vscodePassword": "xxxx**$**xxxx",
                         *         "expiredTime": "1750828527799",
                         *         "isActive": true,
                         *         "status": "DEPLOY_APPLICATION_SUCCESS",
                         *         "capacity": "0.5CPU, 1GB RAM",
                         *         "email": "abc@gmail.com",
                         *         "spaceId": 777,
                         *         "strategy": "live"
                         *       }
                         *     ]
                         */
                        applications?: unknown[];
                    };
                };
            };
        };
    };
    DecoupledIOController_quickStart: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                spaceId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDioAppDTO"];
            };
        };
        responses: {
            /** @description Return result of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 685a687709ec8e6d00d2508c */
                        applicationId?: string;
                        /** @example https://domain.apps.decoupled.io */
                        applicationURL?: string;
                        /** @example https://cs-domain.apps.decoupled.io */
                        vscodeURL?: string;
                        /** @example xxxx****xxxx */
                        vscodePassword?: string;
                        /** @example 1750828527758 */
                        expiredTime?: number;
                        /** @example true */
                        isActive?: boolean;
                        /** @example DEPLOY_APPLICATION_SUCCESS */
                        status?: string;
                        /** @example 0.5CPU, 1GB RAM */
                        capacity?: string;
                        /** @example abc@gmail.com */
                        email?: string;
                        /** @example 777 */
                        spaceId?: number;
                        /** @example dev */
                        strategy?: string;
                    };
                };
            };
        };
    };
    DecoupledIOController_cloneDioApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                spaceId: number;
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CloneDioAppDTO"];
            };
        };
        responses: {
            /** @description Return result of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 685a687709ec8e6d00d2508c */
                        applicationId?: string;
                        /** @example https://domain.apps.decoupled.io */
                        applicationURL?: string;
                        /** @example https://cs-domain.apps.decoupled.io */
                        vscodeURL?: string;
                        /** @example xxxx****xxxx */
                        vscodePassword?: string;
                        /** @example 1750828527758 */
                        expiredTime?: number;
                        /** @example true */
                        isActive?: boolean;
                        /** @example DEPLOY_APPLICATION_SUCCESS */
                        status?: string;
                        /** @example 0.5CPU, 1GB RAM */
                        capacity?: string;
                        /** @example abc@gmail.com */
                        email?: string;
                        /** @example 777 */
                        spaceId?: number;
                        /** @example dev */
                        strategy?: string;
                    };
                };
            };
            /** @description Application is not ready to clone. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Application is not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    DecoupledIOController_getApplicationById: {
        parameters: {
            query: {
                /** @description User email */
                email: string;
            };
            header?: never;
            path: {
                spaceId: number;
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Return result of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 685a687709ec8e6d00d2508c */
                        applicationId?: string;
                        /** @example https://domain.apps.decoupled.io */
                        applicationURL?: string;
                        /** @example https://cs-domain.apps.decoupled.io */
                        vscodeURL?: string;
                        /** @example xxxx****xxxx */
                        vscodePassword?: string;
                        /** @example 1750828527758 */
                        expiredTime?: number;
                        /** @example true */
                        isActive?: boolean;
                        /** @example DEPLOY_APPLICATION_SUCCESS */
                        status?: string;
                        /** @example 0.5CPU, 1GB RAM */
                        capacity?: string;
                        /** @example abc@gmail.com */
                        email?: string;
                        /** @example 777 */
                        spaceId?: number;
                        /** @example dev */
                        strategy?: string;
                    };
                };
            };
            /** @description Application is not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    DecoupledIOController_extendApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                spaceId: number;
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExtendDioAppDTO"];
            };
        };
        responses: {
            /** @description Return result of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 685a687709ec8e6d00d2508c */
                        applicationId?: string;
                        /** @example https://domain.apps.decoupled.io */
                        applicationURL?: string;
                        /** @example https://cs-domain.apps.decoupled.io */
                        vscodeURL?: string;
                        /** @example xxxx****xxxx */
                        vscodePassword?: string;
                        /** @example 1750828527758 */
                        expiredTime?: number;
                        /** @example true */
                        isActive?: boolean;
                        /** @example DEPLOY_APPLICATION_SUCCESS */
                        status?: string;
                        /** @example 0.5CPU, 1GB RAM */
                        capacity?: string;
                        /** @example abc@gmail.com */
                        email?: string;
                        /** @example 777 */
                        spaceId?: number;
                        /** @example dev */
                        strategy?: string;
                    };
                };
            };
            /** @description Application is not ready to extend. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Application is not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    DecoupledIOController_pauseApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                spaceId: number;
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PauseDioAppDTO"];
            };
        };
        responses: {
            /** @description Status only */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
            /** @description Application is not ready to pause. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Application is not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    DecoupledIOController_unpauseApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                spaceId: number;
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UnPauseDioAppDTO"];
            };
        };
        responses: {
            /** @description Return result of applications */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 685a687709ec8e6d00d2508c */
                        applicationId?: string;
                        /** @example https://domain.apps.decoupled.io */
                        applicationURL?: string;
                        /** @example https://cs-domain.apps.decoupled.io */
                        vscodeURL?: string;
                        /** @example xxxx****xxxx */
                        vscodePassword?: string;
                        /** @example 1750828527758 */
                        expiredTime?: number;
                        /** @example true */
                        isActive?: boolean;
                        /** @example DEPLOY_APPLICATION_SUCCESS */
                        status?: string;
                        /** @example 0.5CPU, 1GB RAM */
                        capacity?: string;
                        /** @example abc@gmail.com */
                        email?: string;
                        /** @example 777 */
                        spaceId?: number;
                        /** @example dev */
                        strategy?: string;
                    };
                };
            };
            /** @description Application can not unpause. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Application is not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    DecoupledIOController_deleteApplication: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                spaceId: number;
                applicationId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeactivateDioAppDTO"];
            };
        };
        responses: {
            /** @description Status only */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example success */
                        status?: string;
                    };
                };
            };
            /** @description Application has already deactivated. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Application is not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
}
