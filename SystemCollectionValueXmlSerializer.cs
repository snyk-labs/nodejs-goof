using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Xml.Linq;
using Composite.Core.Types;
using Composite.Data;


namespace Composite.Core.Serialization
{
    internal sealed class SystemCollectionValueXmlSerializer : IValueXmlSerializer
    {
        public bool TrySerialize(Type objectToSerializeType, object objectToSerialize, IXmlSerializer xmlSerializer, out XElement serializedObject)
        {
            if (objectToSerializeType == null) throw new ArgumentNullException("objectToSerializeType");
            if (xmlSerializer == null) throw new ArgumentNullException("xmlSerializer");

            serializedObject = null;


            bool isArray = objectToSerializeType.IsArray;
            if (!objectToSerializeType.IsGenericType && !isArray) return false;

            if (isArray)
            {
                objectToSerializeType = objectToSerializeType.GetInterfaces()
                    .FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof (ICollection<>));

                if (objectToSerializeType == null)
                {
                    return false;
                }
            }
            
            Type genericType = objectToSerializeType.GetGenericTypeDefinition();

            MethodInfo methodInfo;

            if (genericType == typeof(List<>) || genericType == typeof(ICollection<>))
            {
                methodInfo = StaticReflection.GetGenericMethodInfo(o => SerializeCollection<object>(null, null));
            }
            else if (genericType == typeof(Dictionary<,>))
            {
                methodInfo = StaticReflection.GetGenericMethodInfo(o => SerializeDictionary<object, object>(null, null));
            }
            else if (genericType == typeof(KeyValuePair<,>))
            {
                methodInfo = StaticReflection.GetGenericMethodInfo(o => SerializeKeyValuePair(new KeyValuePair<object, object>(), null));
            }
            else
            {
                return false;
            }

            methodInfo = methodInfo.MakeGenericMethod(objectToSerializeType.GetGenericArguments());

            XElement result = methodInfo.Invoke(null, new object[] { objectToSerialize, xmlSerializer }) as XElement;
            string serializedType = TypeManager.SerializeType(objectToSerializeType);

            result.Add(new XAttribute("type", serializedType));
            serializedObject = result;
            return true;
        }



        public bool TryDeserialize(XElement serializedObject, IXmlSerializer xmlSerializer, out object deserializedObject)
        {
            if (serializedObject == null) throw new ArgumentNullException("serializedObject");
            if (xmlSerializer == null) throw new ArgumentNullException("xmlSerializer");

            deserializedObject = null;

            XAttribute typeAttribute = serializedObject.Attribute("type");
            if (typeAttribute == null) return false;

            Type type = TypeManager.GetType(typeAttribute.Value);

            if (type.IsGenericType == false) return false;
            Type genericType = type.GetGenericTypeDefinition();


            MethodInfo methodInfo;

            if (genericType == typeof(List<>))
            {
                methodInfo = StaticReflection.GetGenericMethodInfo(o => DeserializeList<object>(null, null));
            }
            else if (genericType == typeof(Dictionary<,>))
            {
                methodInfo = StaticReflection.GetGenericMethodInfo(o => DeserializeDictionary<object, object>(null, null));
            }
            else if (genericType == typeof(KeyValuePair<,>))
            {
                methodInfo = StaticReflection.GetGenericMethodInfo(o => DeserializeKeyValuePair<object, object>(null, null));
            }
            else
            {
                return false;
            }

            methodInfo = methodInfo.MakeGenericMethod(type.GetGenericArguments());

            try
            {
                object result = methodInfo.Invoke(null, new object[] { serializedObject, xmlSerializer });
                if (result != null)
                {
                    deserializedObject = result;
                    return true;
                }
                
                return false;
            }
            catch (TargetInvocationException exception)
            {
                if (exception.InnerException is DataSerilizationException)
                {
                    throw exception.InnerException;
                }
                
                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }




        private static XElement SerializeCollection<T>(ICollection<T> listToSerialize, IXmlSerializer xmlSerializer)
        {
            XElement result = new XElement("List");

            if (listToSerialize == null) return result;

            foreach (T itemValue in listToSerialize)
            {
                XElement serializedItemValue = xmlSerializer.Serialize(typeof(T), itemValue);

                result.Add(serializedItemValue);
            }

            return result;
        }



        private static List<T> DeserializeList<T>(XElement serializedObject, IXmlSerializer xmlSerializer)
        {
            if (serializedObject.Name.LocalName != "List") return null;

            List<T> result = new List<T>();

            foreach (XElement childElement in serializedObject.Elements())
            {
                object childValue = xmlSerializer.Deserialize(childElement);

                result.Add((T)childValue);
            }

            return result;
        }



        private static XElement SerializeDictionary<TKey, TValue>(Dictionary<TKey, TValue> dictionaryToSerialize, IXmlSerializer xmlSerializer)
        {
            XElement result = new XElement("Dictionary");

            foreach (KeyValuePair<TKey, TValue> kvp in dictionaryToSerialize)
            {
                XElement serializedKey = xmlSerializer.Serialize(typeof(TKey), kvp.Key);
                XElement serializedValue = xmlSerializer.Serialize(typeof(TValue), kvp.Value);

                result.Add(new XElement("KeyPair",
                    new XElement("Key", serializedKey),
                    new XElement("Value", serializedValue)));
            }

            return result;
        }



        private static Dictionary<TKey, TValue> DeserializeDictionary<TKey, TValue>(XElement serializedObject, IXmlSerializer xmlSerializer)
        {
            if (serializedObject.Name.LocalName != "Dictionary") return null;

            Dictionary<TKey, TValue> result = new Dictionary<TKey, TValue>();

            foreach (XElement childElement in serializedObject.Elements("KeyPair"))
            {
                XElement keyElement = childElement.Element("Key");
                if (keyElement == null) return null;
                object keyValue = xmlSerializer.Deserialize(keyElement.Elements().Single());

                XElement valueElement = childElement.Element("Value");
                if (valueElement == null) return null;
                object valueValue = xmlSerializer.Deserialize(valueElement.Elements().Single());

                result.Add((TKey)keyValue, (TValue)valueValue);
            }

            return result;
        }



        private static XElement SerializeKeyValuePair<TKey, TValue>(KeyValuePair<TKey, TValue> KeyValuePairToSerialize, IXmlSerializer xmlSerializer)
        {
            XElement result = new XElement("KeyValuePair");

            XElement serializedKey = xmlSerializer.Serialize(typeof(TKey), KeyValuePairToSerialize.Key);
            XElement serializedValue = xmlSerializer.Serialize(typeof(TValue), KeyValuePairToSerialize.Value);

            result.Add(new XElement("Key", serializedKey));
            result.Add(new XElement("Value", serializedValue));

            return result;
        }



        private static KeyValuePair<TKey, TValue> DeserializeKeyValuePair<TKey, TValue>(XElement serializedObject, IXmlSerializer xmlSerializer)
        {
            if (serializedObject.Name.LocalName != "KeyValuePair") throw new InvalidOperationException();

            XElement keyElement = serializedObject.Element("Key");
            if (keyElement == null) throw new InvalidOperationException();
            object keyValue = xmlSerializer.Deserialize(keyElement.Elements().Single());

            XElement valueElement = serializedObject.Element("Value");
            if (valueElement == null) throw new InvalidOperationException();
            object valueValue = xmlSerializer.Deserialize(valueElement.Elements().Single());

            KeyValuePair<TKey, TValue> result = new KeyValuePair<TKey, TValue>((TKey)keyValue, (TValue)valueValue);

            return result;
        }
    }
}
