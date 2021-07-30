using System.Collections.Generic;
using Composite.Core.Application.Plugins.ApplicationStartupHandler;
using Composite.Core.Application.Plugins.ApplicationStartupHandler.Runtime;
using Composite.Core.Configuration;


namespace Composite.Core.Application.Foundation
{
    internal sealed class ApplicationStartupHandlerRegistryImpl : IApplicationStartupHandlerRegistry
    {
        private static List<string> _handlerNames = null;
        private static object _lock = new object();

        public IEnumerable<string> ApplicationStartupHandlerNames
        {
            get
            {
                Initialize();

                foreach (string name in _handlerNames)
                {
                    yield return name;
                }
            }
        }



        private void Initialize()
        {
            if (_handlerNames == null)
            {
                lock (_lock)
                {
                    if (_handlerNames == null)
                    {
                        _handlerNames = new List<string>();

                        ApplicationStartupHandlerSettings applicationStartupHandlerSettings = ConfigurationServices.ConfigurationSource.GetSection(ApplicationStartupHandlerSettings.SectionName) as ApplicationStartupHandlerSettings;
                        foreach (ApplicationStartupHandlerData applicationStartupHandlerData in applicationStartupHandlerSettings.ApplicationStartupHandlerPlugins)
                        {
                            _handlerNames.Add(applicationStartupHandlerData.Name);
                        }
                    }
                }
            }
        }


        public void Flush()
        {
            _handlerNames = null;
        }
    }
}
