{{/*
Expand the name of the chart.
*/}}
{{- define "askyia.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "askyia.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "askyia.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "askyia.labels" -}}
helm.sh/chart: {{ include "askyia.chart" . }}
{{ include "askyia.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: askyia
{{- end }}

{{/*
Selector labels
*/}}
{{- define "askyia.selectorLabels" -}}
app.kubernetes.io/name: {{ include "askyia.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Database URL
*/}}
{{- define "askyia.databaseUrl" -}}
postgresql+asyncpg://{{ .Values.postgres.auth.username }}:{{ .Values.postgres.auth.password }}@postgres:{{ .Values.postgres.service.port }}/{{ .Values.postgres.auth.database }}
{{- end }}