import httpx

async def fetch_experimental_drugs(disease: str):
    # ClinicalTrials.gov API v2 URL
    base_url = "https://clinicaltrials.gov/api/v2/studies"
    
    # We want to filter for trials that are currently recruiting and 
    # involve an 'Intervention' (which is usually the drug being tested)
    params = {
        "query.cond": disease,
        "filter.overallStatus": "RECRUITING",
        "pageSize": 5  # Get top 5 ongoing trials
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(base_url, params=params, timeout=15.0)
        
        if response.status_code != 200:
            return None
            
        studies = response.json().get("studies", [])
        
        processed_experimental = []
        for study in studies:
            protocol = study.get("protocolSection", {})
            identification = protocol.get("identificationModule", {})
            arms = protocol.get("armsInterventionsModule", {})
            
            # Extract the drug/intervention name
            interventions = arms.get("interventions", [])
            drug_names = [i.get("name") for i in interventions if i.get("type") == "DRUG"]
            
            processed_experimental.append({
                "trial_title": identification.get("briefTitle", "N/A"),
                "drug_name": drug_names[0] if drug_names else "Experimental Compound",
                "status": protocol.get("statusModule", {}).get("overallStatus"),
                "description": protocol.get("descriptionModule", {}).get("briefSummary", "")[:200] + "..."
            })
            
        return processed_experimental