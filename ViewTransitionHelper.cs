using System;
using Composite.C1Console.Actions;
using Composite.C1Console.Events;
using System.Web;
using Composite.C1Console.Elements;

namespace Composite.Core.WebClient.FlowMediators
{
    internal static class ViewTransitionHelper
    {
        internal static string MakeViewId(string serializedFlowHandle)
        {
            return "view" + serializedFlowHandle.GetHashCode();
        }

        internal static void HandleRerender(string consoleId, string elementProviderName, FlowToken flowToken, FlowUiDefinitionBase oldUiDefinition, FlowUiDefinitionBase newUiDefinition, FlowControllerServicesContainer servicesContainer)
        {
            if (newUiDefinition.UiContainerType.ActionResultResponseType != oldUiDefinition.UiContainerType.ActionResultResponseType)
            {
                var messageService = servicesContainer.GetService<IManagementConsoleMessageService>();
                messageService.CloseCurrentView();
                HandleNew(consoleId, elementProviderName, string.Empty, flowToken, newUiDefinition);
            }
            else
            {
                // Force update in same container
                HttpContext.Current.Response.Redirect(HttpContext.Current.Request.Url.PathAndQuery, false);
            }
        }


        internal static void HandleNew(string consoleId, string elementProviderName, string serializedEntityToken, FlowToken flowToken, FlowUiDefinitionBase uiDefinition)
        {
            ActionResultResponseType actionViewType = uiDefinition.UiContainerType.ActionResultResponseType;

            if (actionViewType != ActionResultResponseType.None)
            {
                FlowHandle flowHandle = new FlowHandle(flowToken);
                string serializedFlowHandle = flowHandle.Serialize();
                string viewId = MakeViewId(serializedFlowHandle);

                ViewType viewType;
                switch (actionViewType)
                {
                    case ActionResultResponseType.OpenDocument:
                        viewType = ViewType.Main;
                        break;
                    case ActionResultResponseType.OpenModalDialog:
                        viewType = ViewType.ModalDialog;
                        break;
                    default:
                        throw new Exception("unknown action response type");
                }

                string url = string.Format("{0}?consoleId={1}&flowHandle={2}&elementProvider={3}",
                    UrlUtils.ResolveAdminUrl("content/flow/FlowUi.aspx"),
                    consoleId,
                    HttpUtility.UrlEncode(serializedFlowHandle),
                    HttpUtility.UrlEncode(elementProviderName));

                OpenViewMessageQueueItem openView = new OpenViewMessageQueueItem
                {
                    ViewType = viewType,
                    EntityToken = serializedEntityToken,
                    FlowHandle = flowHandle.Serialize(),
                    Url = url,
                    ViewId = viewId
                };

                if (uiDefinition is VisualFlowUiDefinitionBase)
                {
                    VisualFlowUiDefinitionBase visualUiDefinition = (VisualFlowUiDefinitionBase)uiDefinition;
                    if (string.IsNullOrEmpty(visualUiDefinition.ContainerLabel) == false) openView.Label = visualUiDefinition.ContainerLabel;
                }

                ConsoleMessageQueueFacade.Enqueue(openView, consoleId);
            }
        }

        internal static void HandleCloseCurrentView(IFlowUiContainerType uiContainerType)
        {
            string redirectUrl;
            switch (uiContainerType.ContainerName)
            {

                case "Document":
                    redirectUrl = UrlUtils.ResolveAdminUrl("content/flow/FlowUiCompleted.aspx");
                    break;
                case "Wizard":
                case "DataDialog":
                case "ConfirmDialog":
                    redirectUrl = UrlUtils.ResolveAdminUrl("content/flow/FlowUiCompletedDialog.aspx");
                    break;
                default:
                    throw new NotImplementedException("Unknown container " + uiContainerType.ContainerName);
            }

            HttpContext.Current.Response.Redirect(redirectUrl, false);
        }
    }
}
