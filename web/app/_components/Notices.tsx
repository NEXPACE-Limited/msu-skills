/** The five notices from README's `## Important Notes`, verbatim. AGENTS.md forbids
 *  softening them; the README is the copy to change first. */
const NOTICES = [
  'MSU Resource Skills are reference instructions for using MSU game resources supplied through the MSU Open API. They do not provide the resources, operate your AI agent, or generate outputs themselves.',
  'Use of MSU Resource Skills, Resource MCP, and the MSU Open API is subject to the MSU API Terms, Builder Terms, EULA, applicable policies, and applicable laws.',
  'AI-generated outputs may be inaccurate, incomplete, non-compliant, or infringing. Review, test, and validate generated code, resource selections, API calls, and final app behavior before use.',
  'Keep MSU Builder OpenAPI keys, MCP connections, wallet or account access, and user data secure. Do not expose credentials in prompts, logs, repositories, or untrusted tools.',
  'Do not redistribute, resell, sublicense, reverse engineer, extract, scrape, or use Resource Skills or accessed MSU resources to train, fine-tune, develop, improve, or benchmark AI or machine-learning models or competing services, except as expressly permitted.'
]

export function Notices() {
  return (
    <div className="notes">
      <ul>
        {NOTICES.map(notice => (
          <li key={notice}>{notice}</li>
        ))}
      </ul>
    </div>
  )
}
