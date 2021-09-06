public with sharing class picklistDatatableEditContoller
{

    /**
     * @description       : Method is used for updating the record after datatable is updated
     * @param             : String strObjectApiName,String strfieldSetName,Integer limitSize,Integer offset
     * @return            : string,Integer
     * @author            : Vrushabh Uprikar
     * @last modified on  : 02-09-2021
     * @last modified by  : Vrushabh Uprikar
    **/
    @AuraEnabled
    public static string getUpdatedDataOnly(String strObjectApiName, String strfieldSetName, Integer offset)
    {
        Map<String, String> returnMap = new Map<String,String>();
        if(!String.isEmpty(strObjectApiName) && !String.isEmpty(strfieldSetName))
        {
            //get fields from FieldSet
            SObject sObj = (SObject)(Type.forName('Schema.'+ strObjectApiName).newInstance()); //  Create new sObj
            List<Schema.FieldSetMember> lstFSMember =
                sObj.getSObjectType().getDescribe().fieldSets.getMap().get(strfieldSetName).getFields(); // Collecting all fields from fildSet
            //prepare SOQL query based on fieldAPIs
            String query = 'SELECT ';
            for(Schema.FieldSetMember f : lstFSMember) //Use of Schema.FieldSetMember to get the fields from Field Set.
            {
                query += f.getFieldPath() + ', '; // getFieldPath() of FieldSetMember gives the fieldAPI which has been used to build SOQL query.
            }
            query += 'Id FROM ' + strObjectApiName ;
            query += ' ORDER BY LastModifiedDate DESC LIMIT ' + ' OFFSET '+ offset ;
	        //execute query
            List<SObject> lstRecords = Database.query(query);
            //prepare a map which will hold fieldList and recordList and return it
            returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
            return JSON.serialize(returnMap);
        }
        return null; // will return null if ObjectApi and FieldSet not found
    }

    /**
     * @description       : returns initial Records, coloums And Picklist values in the map format
     * @param             : String strObjectApiName,String strfieldSetName,String dynamicLimit
     * @return            : string
     * @author            : Vivek Raj
     * @last modified on  : 02-09-2021
     * @last modified by  : Vrushabh Uprikar
    **/
    @AuraEnabled(cacheable=false)
    public static String getFieldSetAndRecords(String strObjectApiName, String strfieldSetName, String dynamicLimit)
    {
        Map<String, String> returnMap = new Map<String,String>();
        if(!String.isEmpty(strObjectApiName) && !String.isEmpty(strfieldSetName))
        {
            //get fields from FieldSet
            SObject sObj = (SObject)(Type.forName('Schema.'+ strObjectApiName).newInstance()); //  Create new sObj
            List<Schema.FieldSetMember> lstFSMember =
                sObj.getSObjectType().getDescribe().fieldSets.getMap().get(strfieldSetName).getFields(); // Collecting all fields from fildSet
            //prepare SOQL query based on fieldAPIs
            String query = 'SELECT ';
            List<Map<String,List<PickListWrap>>> piclist = new List<Map<String,List<PickListWrap>>>(); // Picklist values with fieldApi Name Map
            List<Map<Schema.sObjectField, Map<String, List<PickListWrap>>>> DPickList = new List<Map<Schema.sObjectField, Map<String, List<PickListWrap>>>>();
            for(Schema.FieldSetMember f : lstFSMember) //Use of Schema.FieldSetMember to get the fields from Field Set.
            {
                query += f.getFieldPath() + ', '; // getFieldPath() of FieldSetMember gives the fieldAPI which has been used to build SOQL query.
 				if(f.getType() == Schema.DisplayType.Picklist)
                {
                    String sObjfield = (String)(strObjectApiName + '.'+f.getFieldPath()); // String to Schema.SobjectField
                    List<String> splitString = sObjfield.split('\\.');
                    Schema.SobjectField theField = Schema.getGlobalDescribe().get(splitString[0]).getDescribe().fields.getMap().get(splitString[1]);
                    
                    Map<Schema.sObjectField, Map<String, List<PickListWrap>>> depPickListValues = new Map<Schema.sObjectField, Map<String, List<PickListWrap>>>(); // Collect Dependent PickLIst Values
                    depPickListValues = getDependentPicklistValues(theField);
                    System.debug('depPickListValues '+ depPickListValues);
                    if(depPickListValues == null || depPickListValues.isEmpty())
                    {
                        String fpath = (String)f.getFieldPath();
                        piclist.add(getPicklistOptions(strObjectApiName,fpath));
                        System.debug('piclist' + piclist);
                    }else {
                        DPickList.add(depPickListValues);
                    }
                }
            }
            System.debug('DPickList: ' + DPickList);
            query += 'Id FROM ' + strObjectApiName ;
            
            query += ' ORDER BY LastModifiedDate DESC LIMIT 10';
            
            
            System.debug('QUERY : '+ query);
	        //execute query
            List<SObject> lstRecords = Database.query(query);
            //prepare a map which will hold fieldList and recordList and return it
            returnMap.put('FIELD_LIST', JSON.serialize(lstFSMember));
            returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
            returnMap.put('PICKVAL_LIST', JSON.serialize(piclist));
            returnMap.put('D_PICKVAL_LIST', JSON.serialize(DPickList));

            return JSON.serialize(returnMap);
        }
        return null; // will return null if ObjectApi and FieldSet not found
    }

    /**
     * @description       : Its updates the draft values in the inline editing datable
     * @param             : String jSONSObject,String sObjectApiName
     * @return            : string
     * @author            : Vivek Raj
     * @last modified on  : 02-09-2021
     * @last modified by  : Vrushabh Uprikar
    **/
    @AuraEnabled
    public static String upsertSOBJRecord(String jSONSObject, String sObjectApiName)
    {
        //Map<String, String> returnMap = new Map<String,String>();
        Schema.SObjectType targetType = Schema.getGlobalDescribe().get(sObjectApiName);
        List<Object> fieldList = (List<Object>)JSON.deserializeUntyped(jSONSObject);
        List<SObject> newSobjectList = new List<SObject>();
        for(Object obj : fieldList )
        {
            SObject newSobject = targetType.newSObject();
            Map<String, Object> fieldMap = (Map<String, Object>)(obj);
            Map<String, Schema.sObjectField> targetFields = targetType.getDescribe().fields.getMap();
            for (String key : fieldMap.keySet())
            {
                Object value = fieldMap.get(key);
                Schema.DisplayType valueType = targetFields.get(key).getDescribe().getType();
                System.debug('valueType: ' + valueType);
                if (value instanceof String && valueType != Schema.DisplayType.String)
                {
                    String svalue = (String)value;
                    if (valueType == Schema.DisplayType.Date)
                    {    
                        String month;
                        String year;
                        String day;
                        year = svalue.substring(0,4);
                        month = svalue.substring(5,7);
                        day = svalue.substring(8,10);
                        Date myDate = Date.newInstance(integer.valueOf(year),integer.valueOf(month),integer.valueOf(day));
                        newSobject.put(key, myDate);
                    } else if(valueType == Schema.DisplayType.DateTime)
                    {
                        svalue = svalue.replace('T',' ');
                        svalue = svalue.replace('Z','');
                        newSobject.put(key, DateTime.valueOfGmt(svalue));
                    } 
                    else if (valueType == Schema.DisplayType.Percent || valueType == Schema.DisplayType.Currency)
                        newSobject.put(key, svalue == '' ? null : Decimal.valueOf(svalue));
                    else if (valueType == Schema.DisplayType.Double)
                        newSobject.put(key, svalue == '' ? null : Double.valueOf(svalue));
                    else if (valueType == Schema.DisplayType.Integer)
                        newSobject.put(key, Integer.valueOf(svalue));
                    else if (valueType == Schema.DisplayType.Base64)
                        newSobject.put(key, Blob.valueOf(svalue));
                    else
                        newSobject.put(key, svalue);
                }
                else
                    newSobject.put(key, value);
            }
            newSobjectList.add(newSobject);
            System.debug('newSobjectList '+newSobjectList);
        }
        try
        {
            upsert newSobjectList;
            System.debug(' ::Success:: ');
            return 'Success';
        } catch(Exception e)
        {
            System.debug('Error in Update : '+e.getMessage());
            return ''+e.getMessage();
        }
    }

    /**
     * @description       : Getting the Picklist values from the fieldset
     * @param             : String objectApiName,String fieldApiName
     * @return            : string
     * @author            : Vrushabh Uprikar
     * @last modified on  : 02-09-2021
     * @last modified by  : Vrushabh Uprikar
    **/
    public static Map<String,List<PickListWrap>> getPicklistOptions(String objectApiName, String fieldApiName)
    { // Eg. Account, Type(FieldApiName)

        //List<String> picklistOptions = new List<String>();
        List<PickListWrap> PickListWrapList = new List<PickListWrap>();
        Map<String,List<PickListWrap>> PickListWrapMap = new Map<String,List<PickListWrap>>();
        try 
        {
            Schema.SObjectType obj_describe = Schema.getGlobalDescribe().get(objectApiName);
            Schema.DescribeSObjectResult obj_describe_result = obj_describe.getDescribe();
            Map<String,Schema.SObjectField> fields = obj_describe_result.fields.getMap();
            Schema.DescribeFieldResult fieldResult = fields.get(fieldApiName).getDescribe();
            List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
            for (Schema.PicklistEntry pickListVal : ple)
            {
                String option = pickListVal.getValue();
                PickListWrapList.add(new PickListWrap(pickListVal.getLabel(),pickListVal.getValue()));
                //picklistOptions.add(option);
            }

            PickListWrapMap.put(fieldApiName, PickListWrapList);

        } catch (Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }
        return PickListWrapMap;
    }

    public class PickListWrap{
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        
        public PickListWrap(String label, String value){
        	this.value = value;
            this.label = label;
        }
    }
    

    /**
     * @description       : updates the data when replace funtionality is called.
     * @param             : String strObjectApiName,String Record_Id,Replace_text,Replace_field,field_type
     * @return            : string
     * @author            : Vrushabh Uprikar
     * @last modified on  : 02-09-2021
     * @last modified by  : Vrushabh Uprikar
    **/ 
    @AuraEnabled
    public static String updateRecords(String strObjectApiName, String Record_Id, 
                                    String Replace_text, String Replace_field, String field_type)
    {
        if(!String.isEmpty(Record_Id) && !String.isEmpty(Replace_text))
        {
            //get fields from FieldSet
            SObject sObj = (SObject)(Type.forName('Schema.'+ strObjectApiName).newInstance()); //  Create new sObj
			sObj.Id = Record_Id;
            if(field_type == 'double')
            {
                Integer myInt = Integer.valueOf(Replace_text);
                System.debug('myInt: ' + myInt);
                sObj.put(Replace_field,myInt);
            }else if(field_type == 'date')
            {
                String month;
                String year;
                String day;
                year = Replace_text.substring(0,4);
                month = Replace_text.substring(5,7);
                day = Replace_text.substring(8,10);
                Date myDate = Date.newInstance(integer.valueOf(year),integer.valueOf(month),integer.valueOf(day));
                sObj.put(Replace_field,myDate);

            }else if(field_type == 'datetime')
            {
                Datetime dt1 = Datetime.valueOf(Replace_text);
                System.debug(' Parsed DateTime is ' + dt1 );
                sObj.put(Replace_field,dt1);

            }else 
            {
                sObj.put(Replace_field,Replace_text);
            }
			                               
            try 
            {
                update sObj;
                System.debug(' ::Success:: ');
                return 'Success'; 
            } catch(Exception e) 
            {
                System.debug('Error in Update : '+e.getMessage());
                return ''+e.getMessage(); 
            }
        }
        return 'Something Went Wrong';
    }

    /**
     * @description       : Funtionality is used for deleting the Records.
     * @param             : idlist
     * @return            : string
     * @author            : Vrushabh Uprikar
     * @last modified on  : 02-09-2021
     * @last modified by  : Vrushabh Uprikar
    **/
    @AuraEnabled
    public static string deleteRecords(List<Id> idlist)
    {
        try 
        {
            Database.DeleteResult[] deleteResults = Database.delete( idlist, true );
            return 'Success';
            
        } catch (Exception e) 
        {
            return ''+e.getMessage();
        }
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Map<Schema.sObjectField, Map<String, List<PickListWrap>>> getDependentPicklistValues(Schema.sObjectField dependToken) 
    {
        Schema.DescribeFieldResult depend = dependToken.getDescribe();
        //controlling picklist field
        Schema.sObjectField controlToken = depend.getController();
        System.debug('controlToken: ' + controlToken);
        if (controlToken == null) 
        {
            return null;
        }
    
        Schema.DescribeFieldResult control = controlToken.getDescribe();
        List<Schema.PicklistEntry> controlEntries;
        if(control.getType() != Schema.DisplayType.Boolean)
        {
            controlEntries = control.getPicklistValues();
        }
    
        String base64map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        Map<String,List<String>> dependentPicklistValues = new Map<String,List<String>>();
        for (Schema.PicklistEntry entry : depend.getPicklistValues()) 
        {
            if (entry.isActive() && String.isNotEmpty(String.valueOf(((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(entry))).get('validFor'))))
            {
                List<String> base64chars =
                        String.valueOf(((Map<String,Object>) JSON.deserializeUntyped(JSON.serialize(entry))).get('validFor')).split('');
                for (Integer index = 0; index < (controlEntries != null ? controlEntries.size() : 2); index++)
                {
                    // each of picklist value of controlling picklist
                    Object controlValue =
                            (controlEntries == null
                                    ?   (Object) (index == 1)
                                    :   (Object) (controlEntries[index].isActive() ? controlEntries[index].getLabel() : null)
                            );
                    Integer bitIndex = index / 6;
                    if (bitIndex > base64chars.size() - 1)
                    {
                        break;
                    }
                    Integer bitShift = 5 - Math.mod(index, 6);
                    if  (controlValue == null || (base64map.indexOf( base64chars[ bitIndex ] ) & (1 << bitShift)) == 0)
                        continue;
                    if (!dependentPicklistValues.containsKey((String) controlValue))
                    {
                        dependentPicklistValues.put((String) controlValue, new List<String>());
                    }
                    dependentPicklistValues.get((String) controlValue).add(entry.getLabel());
                    // System.debug('controlValue: ' + controlValue);
                }
            }
        }
        
        Map<String, List<PickListWrap>> aaaMap = new Map<String, List<PickListWrap>>();
        for(String key :dependentPicklistValues.keySet())
        {
            List<PickListWrap> picklistL = new List<PickListWrap>();
            for(String key1 : dependentPicklistValues.get(key))
            {
                picklistL.add(new PickListWrap(key1, key1));
            }
            aaaMap.put(key, picklistL);
        }
        Map<Schema.sObjectField, Map<String, List<PickListWrap>>> D_values = new Map<Schema.sObjectField, Map<String, List<PickListWrap>>>();
        D_values.put(controlToken,aaaMap);
        System.debug('D_values: ' + D_values);
        return D_values;
    }
}