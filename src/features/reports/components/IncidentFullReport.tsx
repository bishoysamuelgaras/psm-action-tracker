import type { ReactNode } from "react";
import { BidiBlock, BidiCode, BidiText } from "@/components/ui/bidi";
import type {
  IncidentFullReport as IncidentFullReportData,
  IncidentReportAction,
  IncidentReportRecommendation
} from "@/features/reports/api/reports.api";
import { formatDateLabel, formatDateTimeLabel } from "@/lib/utils";
import { getPriorityDisplayLabel } from "@/lib/priority";

function formatOptionalDate(value: string | null | undefined) {
  return value ? formatDateLabel(value) : "—";
}

function formatOptionalText(value: string | null | undefined) {
  return value && value.trim() ? value : "—";
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function priorityLabel(priorityName: string | null | undefined, priorityCode: string | null | undefined) {
  return getPriorityDisplayLabel(priorityCode, priorityName);
}

function statusLabel(action: IncidentReportAction) {
  return action.statusName || action.statusCode || "—";
}

function buildParticipants(report: IncidentFullReportData) {
  const people = new Map<string, { name: string; jobTitle: string | null; roles: Set<string> }>();

  report.recommendations.forEach((recommendation) => {
    recommendation.actions.forEach((action) => {
      if (action.responsible) {
        const bucket =
          people.get(action.responsible.id) ??
          { name: action.responsible.fullName, jobTitle: action.responsible.jobTitle, roles: new Set<string>() };
        bucket.roles.add("Responsible");
        people.set(action.responsible.id, bucket);
      }

      if (action.owner) {
        const bucket =
          people.get(action.owner.id) ??
          { name: action.owner.fullName, jobTitle: action.owner.jobTitle, roles: new Set<string>() };
        bucket.roles.add("Owner");
        people.set(action.owner.id, bucket);
      }

      if (action.verifier) {
        const bucket =
          people.get(action.verifier.id) ??
          { name: action.verifier.fullName, jobTitle: action.verifier.jobTitle, roles: new Set<string>() };
        bucket.roles.add("Verifier");
        people.set(action.verifier.id, bucket);
      }
    });
  });

  return Array.from(people.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function IncidentFullReport({ report }: { report: IncidentFullReportData }) {
  const participants = buildParticipants(report);

  return (
    <article id="incident-report-printable" className="report-doc text-slate-900">
      <header className="report-header report-keep-together">
        <div>
          <div className="report-kicker">ANRPC • PSM • INCIDENT ACTION TRACKER</div>
          <h1 className="report-title">Incident Full Report</h1>
          <BidiBlock className="report-subtitle">{report.source.title}</BidiBlock>
        </div>

        <div className="report-header-side">
          <div className="report-ref"><BidiCode>{report.source.sourceNo}</BidiCode></div>
          <div className="report-header-meta">Generated {new Date().toLocaleString()}</div>
        </div>
      </header>

      <section className="report-section report-keep-together">
        <h2 className="report-section-title">1. Source overview</h2>
        <table className="report-meta-table">
          <tbody>
            <tr>
              <th>Source no.</th>
              <td><BidiCode>{report.source.sourceNo}</BidiCode></td>
              <th>Type</th>
              <td><BidiText>{formatOptionalText(report.source.sourceTypeName)}</BidiText></td>
            </tr>
            <tr>
              <th>Incident date</th>
              <td>{formatDateLabel(report.source.sourceDate)}</td>
              <th>Department</th>
              <td><BidiText>{formatOptionalText(report.source.departmentName)}</BidiText></td>
            </tr>
            <tr>
              <th>Reference</th>
              <td><BidiText>{formatOptionalText(report.source.referenceNo)}</BidiText></td>
              <th>Prepared by</th>
              <td><BidiText>{formatOptionalText(report.source.createdBy?.fullName)}</BidiText></td>
            </tr>
          </tbody>
        </table>

        {report.source.summary ? (
          <div className="report-block">
            <div className="report-block-title">Incident summary</div>
            <BidiBlock className="report-paragraph">{report.source.summary}</BidiBlock>
          </div>
        ) : null}
      </section>

      <section className="report-section report-keep-together">
        <h2 className="report-section-title">2. Report totals</h2>
        <table className="report-totals-table">
          <thead>
            <tr>
              <th>Recommendations</th>
              <th>Actions</th>
              <th>Open</th>
              <th>Closed</th>
              <th>Verified</th>
              <th>Overdue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{report.stats.totalRecommendations}</td>
              <td>{report.stats.totalActions}</td>
              <td>{report.stats.openActions}</td>
              <td>{report.stats.closedActions}</td>
              <td>{report.stats.verifiedActions}</td>
              <td>{report.stats.overdueActions}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="report-section report-keep-together">
        <h2 className="report-section-title">3. People involved</h2>
        {participants.length ? (
          <table className="report-grid-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role in actions</th>
                <th>Job title</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((person) => (
                <tr key={`${person.name}-${person.jobTitle || ""}`}>
                  <td><BidiText>{person.name}</BidiText></td>
                  <td>{Array.from(person.roles).join(" / ")}</td>
                  <td><BidiText>{formatOptionalText(person.jobTitle)}</BidiText></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyText>No people assigned yet.</EmptyText>
        )}
      </section>

      <section className="report-section">
        <h2 className="report-section-title">4. Recommendations and actions</h2>
        {report.recommendations.length ? (
          <div className="report-stack">
            {report.recommendations.map((recommendation, index) => (
              <RecommendationSection
                key={recommendation.id}
                recommendation={recommendation}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyText>No recommendations linked to this source yet.</EmptyText>
        )}
      </section>
    </article>
  );
}

function RecommendationSection({
  recommendation,
  index
}: {
  recommendation: IncidentReportRecommendation;
  index: number;
}) {
  return (
    <section className="report-subsection report-keep-together">
      <div className="report-subsection-header">
        <div>
          <div className="report-subsection-kicker">Recommendation {index + 1}</div>
          <h3 className="report-subsection-title"><BidiCode>{recommendation.recommendationNo}</BidiCode></h3>
        </div>
        <div className="report-inline-meta">
          <span>Category: <BidiText>{formatOptionalText(recommendation.categoryName)}</BidiText></span>
          <span>Priority: {priorityLabel(recommendation.priorityName, recommendation.priorityCode)}</span>
          <span>Actions: {recommendation.actions.length}</span>
        </div>
      </div>

      <div className="report-block">
        <div className="report-block-title">Recommendation text</div>
        <BidiBlock className="report-paragraph">{recommendation.recommendationText}</BidiBlock>
      </div>

      {recommendation.actions.length ? (
        <>
          <div className="report-block">
            <div className="report-block-title">Action summary</div>
            <table className="report-grid-table report-tight-table">
              <thead>
                <tr>
                  <th>Action no.</th>
                  <th>Title</th>
                  <th>Responsible</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Effective due</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {recommendation.actions.map((action) => (
                  <tr key={action.id}>
                    <td><BidiCode>{action.actionNo}</BidiCode></td>
                    <td><BidiText>{action.title}</BidiText></td>
                    <td><BidiText>{formatOptionalText(action.responsible?.fullName)}</BidiText></td>
                    <td><BidiText>{formatOptionalText(action.owner?.fullName)}</BidiText></td>
                    <td>{statusLabel(action)}</td>
                    <td>{priorityLabel(action.priorityName, action.priorityCode)}</td>
                    <td>{formatDateLabel(action.latestExtensionUntil || action.dueDate)}</td>
                    <td>{action.progressPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="report-stack">
            {recommendation.actions.map((action, actionIndex) => (
              <ActionDetailsBlock key={action.id} action={action} actionIndex={actionIndex} />
            ))}
          </div>
        </>
      ) : (
        <EmptyText>No actions linked to this recommendation yet.</EmptyText>
      )}
    </section>
  );
}

function ActionDetailsBlock({
  action,
  actionIndex
}: {
  action: IncidentReportAction;
  actionIndex: number;
}) {
  const effectiveDueDate = action.latestExtensionUntil || action.dueDate;

  return (
    <section className="report-action-detail report-keep-together">
      <div className="report-action-head">
        <div>
          <div className="report-subsection-kicker">Action {actionIndex + 1}</div>
          <h4 className="report-action-title"><BidiCode>{action.actionNo}</BidiCode> — <BidiText>{action.title}</BidiText></h4>
        </div>
        <div className="report-inline-meta">
          <span>Status: {statusLabel(action)}</span>
          <span>Priority: {priorityLabel(action.priorityName, action.priorityCode)}</span>
          <span>{action.isOverdue ? "Overdue" : "On track"}</span>
        </div>
      </div>

      {action.description ? (
        <div className="report-block">
          <div className="report-block-title">Action description</div>
          <BidiBlock className="report-paragraph">{action.description}</BidiBlock>
        </div>
      ) : null}

      <table className="report-meta-table report-meta-table-compact">
        <tbody>
          <tr>
            <th>Responsible</th>
            <td><BidiText>{formatOptionalText(action.responsible?.fullName)}</BidiText></td>
            <th>Owner</th>
            <td><BidiText>{formatOptionalText(action.owner?.fullName)}</BidiText></td>
          </tr>
          <tr>
            <th>Verifier</th>
            <td><BidiText>{formatOptionalText(action.verifier?.fullName)}</BidiText></td>
            <th>Progress</th>
            <td>{action.progressPercent}%</td>
          </tr>
          <tr>
            <th>Start date</th>
            <td>{formatOptionalDate(action.startDate)}</td>
            <th>Original due</th>
            <td>{formatDateLabel(action.dueDate)}</td>
          </tr>
          <tr>
            <th>Effective due</th>
            <td>{formatDateLabel(effectiveDueDate)}</td>
            <th>Days to due</th>
            <td>{action.daysToDue == null ? "—" : String(action.daysToDue)}</td>
          </tr>
          <tr>
            <th>Completed</th>
            <td>{formatOptionalDate(action.completedDate)}</td>
            <th>Verified</th>
            <td>{formatOptionalDate(action.verifiedDate)}</td>
          </tr>
        </tbody>
      </table>

      {action.evidenceSummary ? (
        <div className="report-block">
          <div className="report-block-title">Evidence summary</div>
          <BidiBlock className="report-paragraph">{action.evidenceSummary}</BidiBlock>
        </div>
      ) : null}

      <SubtableSection
        title="Progress updates"
        empty="No updates yet."
        hasRows={action.updates.length > 0}
        table={
          <table className="report-grid-table report-tight-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Next follow-up</th>
                <th>Updated by</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {action.updates.map((update) => (
                <tr key={update.id}>
                  <td>{formatDateTimeLabel(update.updateDate || update.createdAt)}</td>
                  <td>{formatOptionalText(update.statusCode)}</td>
                  <td>{update.progressPercent == null ? "—" : `${update.progressPercent}%`}</td>
                  <td>{formatOptionalDate(update.nextFollowUpDate)}</td>
                  <td><BidiText>{formatOptionalText(update.updatedBy?.fullName)}</BidiText></td>
                  <td><BidiText>{update.progressNote}</BidiText></td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      />

      <SubtableSection
        title="Attachments"
        empty="No attachments."
        hasRows={action.attachments.length > 0}
        table={
          <table className="report-grid-table report-tight-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Description / type</th>
                <th>Uploaded at</th>
                <th>Uploaded by</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {action.attachments.map((attachment) => (
                <tr key={attachment.id}>
                  <td><BidiText>{attachment.fileName}</BidiText></td>
                  <td><BidiText>{attachment.description || attachment.mimeType || "Attachment"}</BidiText></td>
                  <td>{formatDateTimeLabel(attachment.uploadedAt)}</td>
                  <td><BidiText>{formatOptionalText(attachment.uploadedBy?.fullName)}</BidiText></td>
                  <td>{formatFileSize(attachment.fileSizeBytes) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      />

      <SubtableSection
        title="Extension requests"
        empty="No extension requests."
        hasRows={action.extensionRequests.length > 0}
        table={
          <table className="report-grid-table report-tight-table">
            <thead>
              <tr>
                <th>Requested until</th>
                <th>Status</th>
                <th>Requested by</th>
                <th>Decided by</th>
                <th>Decision date</th>
                <th>Reason / note</th>
              </tr>
            </thead>
            <tbody>
              {action.extensionRequests.map((request) => (
                <tr key={request.id}>
                  <td>{formatDateLabel(request.requestedUntil)}</td>
                  <td>{request.requestStatus}</td>
                  <td><BidiText>{formatOptionalText(request.requestedBy?.fullName)}</BidiText></td>
                  <td><BidiText>{formatOptionalText(request.decidedBy?.fullName)}</BidiText></td>
                  <td>{formatOptionalDate(request.decidedAt)}</td>
                  <td>
                    <BidiText>{request.reason}</BidiText>
                    {request.decisionNote ? <> / <BidiText>{request.decisionNote}</BidiText></> : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      />
    </section>
  );
}

function SubtableSection({
  title,
  table,
  empty,
  hasRows
}: {
  title: string;
  table: ReactNode;
  empty: string;
  hasRows: boolean;
}) {
  return (
    <div className="report-block">
      <div className="report-block-title">{title}</div>
      {hasRows ? table : <EmptyText>{empty}</EmptyText>}
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <div className="report-empty">{children}</div>;
}
