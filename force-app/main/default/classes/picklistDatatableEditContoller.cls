public with sharing class picklistDatatableEditContoller
{
    @AuraEnabled
    public static string getUpdatedDataOnly(String strObjectApiName, String strfieldSetName)
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
            query += ' order by CreatedDate desc LIMIT 10 ';
	        //execute query
            List<SObject> lstRecords = Database.query(query);
            //prepare a map which will hold fieldList and recordList and return it
            returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
            return JSON.serialize(returnMap);
        }
        return null; // will return null if ObjectApi and FieldSet not found
    }

    @AuraEnabled(cacheable=false)
    public static String getFieldSetAndRecords(String strObjectApiName, String strfieldSetName)
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
            List<List<PickListWrap>> piclist = new List<List<PickListWrap>>(); // Picklist values with fieldApi Name
            for(Schema.FieldSetMember f : lstFSMember) //Use of Schema.FieldSetMember to get the fields from Field Set.
            {
                query += f.getFieldPath() + ', '; // getFieldPath() of FieldSetMember gives the fieldAPI which has been used to build SOQL query.
 				if(f.getType() == Schema.DisplayType.Picklist)
                {
                    String fpath = (String)f.getFieldPath();
                    piclist.add(getPicklistOptions(strObjectApiName,fpath));
                    system.debug(piclist);
                }
            }
            query += 'Id FROM ' + strObjectApiName ;
            query += ' order by CreatedDate desc LIMIT 10 ';
	        //execute query
            List<SObject> lstRecords = Database.query(query);
            //prepare a map which will hold fieldList and recordList and return it
            returnMap.put('FIELD_LIST', JSON.serialize(lstFSMember));
            returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
            returnMap.put('PICKVAL_LIST', JSON.serialize(piclist));

            return JSON.serialize(returnMap);
        }
        return null; // will return null if ObjectApi and FieldSet not found
    }


    @AuraEnabled
    public static String upsertSOBJRecord(String jSONSObject, String sObjectApiName)
    {
        Map<String, String> returnMap = new Map<String,String>();
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
                if (value instanceof String && valueType != Schema.DisplayType.String)
                {
                    String svalue = (String)value;
                    if (valueType == Schema.DisplayType.Date)
                        newSobject.put(key, Date.valueOf(svalue));
                    else if(valueType == Schema.DisplayType.DateTime)
                        newSobject.put(key, DateTime.valueOfGmt(svalue));
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


    public static List<PickListWrap> getPicklistOptions(String objectApiName, String fieldApiName)
    { // Eg. Account, Type(FieldApiName)
        List<String> picklistOptions = new List<String>();
        List<PickListWrap> PickListWrapList = new List<PickListWrap>();
        try {
            Schema.SObjectType obj_describe = Schema.getGlobalDescribe().get(objectApiName) ;
            Schema.DescribeSObjectResult obj_describe_result = obj_describe.getDescribe() ;
            Map<String,Schema.SObjectField> fields = obj_describe_result.fields.getMap() ;
            Schema.DescribeFieldResult fieldResult = fields.get(fieldApiName).getDescribe();
            List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
            for (Schema.PicklistEntry pickListVal : ple)
            {
                String option = pickListVal.getValue();
                PickListWrapList.add(new PickListWrap(pickListVal.getLabel(),pickListVal.getValue(), fieldApiName));
                picklistOptions.add(option);
            }
        } catch (Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }
        return PickListWrapList;
    }

    public class PickListWrap
    {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        @AuraEnabled public String fieldApi;
        public PickListWrap(String label, String value, String fieldApi)
        {
        	this.value = value;
            this.label = label;
            this.fieldApi = fieldApi;

        }
    }
    
      @AuraEnabled
    public static String updateRecords(String strObjectApiName, String Record_Id, String Replace_text, String Replace_field, String field_type){
        if(!String.isEmpty(Record_Id) && !String.isEmpty(Replace_text))
        {
            //get fields from FieldSet
            SObject sObj = (SObject)(Type.forName('Schema.'+ strObjectApiName).newInstance()); //  Create new sObj
			sObj.Id = Record_Id;
            if(field_type == 'double')
            {
                Decimal myDecimal = decimal.valueOf(Replace_text);
                sObj.put(Replace_field,myDecimal);
            }else {
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

    @AuraEnabled
	public static string updateAccounts(Object data) {
    //Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(sObjectApiName);
    //String ListType = 'List<' + sObjectType + '>';
    List<Account> accountsForUpdate = (List<Account>)JSON.deserialize(JSON.serialize(data),List<Account>.class);
    try {
        upsert accountsForUpdate;
        return 'Success: account updated successfully';
    	}
    catch (Exception e) {
        return 'The following exception has occurred: ' + e.getMessage();
    	}
	}
}