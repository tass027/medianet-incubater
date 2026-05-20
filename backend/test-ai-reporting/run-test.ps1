$bodyJson = '{"model":"mistral","stream":false,"prompt":"Tu es un expert en evaluation de startups. Reponds en JSON valide UNIQUEMENT. Analyse: Startup TechAgri, 2 jures. Jure1 Sara score 72 (equipe75 innovation80 marche65 modele60 traction55) feedback: equipe solide innovation reelle modele flou. Jure2 Karim score 62 (equipe70 innovation65 marche70 modele45 traction50) feedback: bon marche modele economique critique. Produis JSON: {synthese:string, analyse_scores:{score_moyen:67,par_critere:[{critere:string,poids:number,min:number,max:number,moyenne:number,consensus:boolean,note:string}],jure_plus_severe:string,jure_plus_indulgent:string}, points_forts:[{titre:string,detail:string,critere:string,nb_jures:number}], points_faibles:[{titre:string,detail:string,critere:string,score_moyen:number}], divergences:[{critere:string,ecart:number,scores_jures:object,explication:string}], synthese_feedbacks:string, recommandation:{decision:string,niveau_confiance:string,justification:string,actions_suggerees:[string]}}"}'

Write-Host "Envoi a Ollama..."
$bytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)
$resp = Invoke-WebRequest -Uri "http://localhost:11434/api/generate" -Method POST -ContentType "application/json; charset=utf-8" -Body $bytes
$data = $resp.Content | ConvertFrom-Json
$r = $data.response.Trim()
if ($r -match '(?s)```(?:json)?(.*?)```') { $r = $Matches[1].Trim() }
Write-Host "--- REPONSE BRUTE (500 chars) ---"
Write-Host $r.Substring(0, [Math]::Min(500, $r.Length))
Write-Host "--- FIN ---"
try {
    $report = $r | ConvertFrom-Json
    Write-Host "JSON VALIDE"
    Write-Host "Decision:" $report.recommandation.decision
} catch {
    Write-Host "JSON INVALIDE:" $_.Exception.Message
}