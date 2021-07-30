using System.Linq;
using Composite.Core.Collections.Generic;
using Composite.Core.Configuration;
using Composite.Core.Parallelization.Plugins.Runtime;


namespace Composite.Core.Parallelization.Foundation
{
    internal sealed class ParallelizationProviderRegistryImpl : IParallelizationProviderRegistry
	{
        // private string _defaultParallelizationProviderName = null;
        private string[] _disabledParallelizationPoints = null;

        private bool? _enabled = null;


        //public string DefaultParallelizationProviderName
        //{
        //    get 
        //    {
        //        if (_defaultParallelizationProviderName == null)                   
        //        {
        //            ParallelizationProviderSettings parallelizationProviderSettings = ConfigurationServices.ConfigurationSource.GetSection(ParallelizationProviderSettings.SectionName) as ParallelizationProviderSettings;

        //            _defaultParallelizationProviderName = parallelizationProviderSettings.DefaultParallelizationProviderName;
        //        }

        //        return _defaultParallelizationProviderName;
        //    }
        //}

        public string[] DisabledParallelizationPoints
        {
            get
            {
                if (_disabledParallelizationPoints == null)
                {
                    var parallelizationProviderSettings = ConfigurationServices.ConfigurationSource.GetSection(ParallelizationProviderSettings.SectionName) as ParallelizationProviderSettings;
                    if (parallelizationProviderSettings != null 
                        && parallelizationProviderSettings.Parallelization != null)
                    {
                        var parConfigNode = parallelizationProviderSettings.Parallelization;

                        _disabledParallelizationPoints = (from ParallelizationSettingsElement configElement in parConfigNode
                                                          where !configElement.Enabled
                                                          select configElement.Name).ToArray();
                    }
                    else
                    {
                        _disabledParallelizationPoints = new string[0];
                    }
                }
                return _disabledParallelizationPoints;
            }
        }

        public bool Enabled
        {
            get
            {
                bool? enabled = _enabled;
                if (enabled == null)
                {
                    var parallelizationProviderSettings = ConfigurationServices.ConfigurationSource.GetSection(ParallelizationProviderSettings.SectionName) as ParallelizationProviderSettings;
                    if(parallelizationProviderSettings == null)
                    {
                        enabled = false;
                    }
                    else
                    {
                        enabled = parallelizationProviderSettings.Parallelization.Enabled;
                    }
                    _enabled = enabled;
                }
                return (bool)enabled;
            }
        }


        public void Flush()
        {
            _enabled = null;
            _disabledParallelizationPoints = null;
        }
    }
}
