using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Web;
using Composite.C1Console.Events;
using System.Threading.Tasks;
using Composite.Core.WebClient.PhantomJs;

namespace Composite.Core.WebClient.Services.WysiwygEditor
{
    /// <exclude />
    [System.ComponentModel.EditorBrowsable(System.ComponentModel.EditorBrowsableState.Never)] 
    public static class PageTemplatePreview
    {
        private static readonly string ServiceUrl = UrlUtils.ResolvePublicUrl("~/Renderers/TemplatePreview.ashx");
        private const string RenderingMode = "template";

        static PageTemplatePreview()
        {
            GlobalEventSystemFacade.OnDesignChange += ClearCache;
        }

        /// <exclude />
        public class PlaceholderInformation
        {
            /// <exclude />
            public string PlaceholderId { get; set; }

            /// <exclude />
            public Rectangle ClientRectangle { get; set; }

            /// <exclude />
            public Rectangle ClientRectangleWithZoom { get; set; }
        }

        /// <exclude />
        public static bool GetPreviewInformation(HttpContext context, Guid pageId, Guid templateId, out string imageFilePath, out PlaceholderInformation[] placeholders)
        {
            int updateHash = BrowserRender.GetLastCacheUpdateTime(RenderingMode).GetHashCode();
            string requestUrl = new UrlBuilder(context.Request.Url.ToString()).ServerUrl 
                + ServiceUrl + $"?p={pageId}&t={templateId}&hash={updateHash}";

            RenderingResult result = null;

            var renderTask = BrowserRender.RenderUrlAsync(context, requestUrl, RenderingMode);
            renderTask.Wait(10000);
            if (renderTask.Status == TaskStatus.RanToCompletion)
            {
                result = renderTask.Result;
            }

            if (result == null)
            {
                imageFilePath = null;
                placeholders = null;
                return false;
            }

            if (result.Status != RenderingResultStatus.Success)
            {
                Log.LogWarning("PageTemplatePreview", "Failed to build preview for page template '{0}'. Reason: {1}; Output:\r\n{2}",
                    templateId, result.Status, string.Join(Environment.NewLine, result.Output));

                imageFilePath = null;
                placeholders = null;
                return false;
            }

            imageFilePath = result.FilePath;
            ICollection<string> output = result.Output;
            const string templateInfoPrefix = "templateInfo:";

            var placeholderData = output.FirstOrDefault(l => l.StartsWith(templateInfoPrefix));

            var pList = new List<PlaceholderInformation>();

            // TODO: use JSON
            if (placeholderData != null)
            {
                foreach (var infoPart in placeholderData.Substring(templateInfoPrefix.Length).Split('|'))
                {
                    string[] parts = infoPart.Split(',');

                    double left, top, width, height;

                    if (parts.Length != 5
                        || !double.TryParse(parts[1], out left)
                        || !double.TryParse(parts[2], out top)
                        || !double.TryParse(parts[3], out width)
                        || !double.TryParse(parts[4], out height))
                    {
                        throw new InvalidOperationException($"Incorrectly serialized template part info: {infoPart}");
                    }

                    var zoom = 1.0;

                    pList.Add(new PlaceholderInformation
                    {
                        PlaceholderId = parts[0], 
                        ClientRectangle = new Rectangle((int)left, (int)top, (int)width, (int)height),
                        ClientRectangleWithZoom = new Rectangle(
                            (int)Math.Round(zoom * left), 
                            (int)Math.Round(zoom * top),
                            (int)Math.Round(zoom * width),
                            (int)Math.Round(zoom * height))
                    });
                }
            }

            placeholders = pList.ToArray();
            return true;
        }

        /// <exclude />
        public static void ClearCache()
        {
            BrowserRender.ClearCache(RenderingMode);
        }
    }
}
