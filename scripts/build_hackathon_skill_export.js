#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const catalogPath = path.join(repoRoot, "HACKATHON_SKILLS.md");
const exportRoot = path.join(repoRoot, "exports", "hackathon-skills-export");
const skillsRoot = path.join(exportRoot, "skills");

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function parseCatalog(markdown) {
  const entries = [];
  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\| `([^`]+)` \| ([^|]+) \| `([^`]+)` \|$/);
    if (!match) continue;

    const [, name, useFor, skillMdPath] = match;
    entries.push({
      name: name.trim(),
      useFor: useFor.trim(),
      skillMdPath: skillMdPath.trim(),
      sourceDir: path.dirname(skillMdPath.trim()),
    });
  }

  const byPath = new Map();
  for (const entry of entries) {
    if (!byPath.has(entry.skillMdPath)) byPath.set(entry.skillMdPath, entry);
  }

  return [...byPath.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

function copyDir(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const item of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, item.name);
    const destinationPath = path.join(destination, item.name);

    if (item.isDirectory()) {
      copyDir(sourcePath, destinationPath);
    } else if (item.isSymbolicLink()) {
      const target = fs.readlinkSync(sourcePath);
      fs.symlinkSync(target, destinationPath);
    } else if (item.isFile()) {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

function writeFile(filePath, content, mode) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  if (mode) fs.chmodSync(filePath, mode);
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildExport() {
  const catalog = fs.readFileSync(catalogPath, "utf8");
  const entries = parseCatalog(catalog);
  const missing = entries.filter((entry) => !fs.existsSync(entry.skillMdPath));

  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.length} skill files:\n` +
        missing.map((entry) => `- ${entry.name}: ${entry.skillMdPath}`).join("\n")
    );
  }

  fs.rmSync(exportRoot, { recursive: true, force: true });
  fs.mkdirSync(skillsRoot, { recursive: true });

  const usedSlugs = new Map();
  const manifest = entries.map((entry) => {
    const baseSlug = slugify(entry.name) || "skill";
    const count = usedSlugs.get(baseSlug) || 0;
    usedSlugs.set(baseSlug, count + 1);
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
    const destinationDir = path.join(skillsRoot, slug);

    copyDir(entry.sourceDir, destinationDir);

    return {
      ...entry,
      slug,
      relativeDir: path.posix.join("skills", slug),
      relativeSkillMd: path.posix.join("skills", slug, "SKILL.md"),
    };
  });

  const manifestTsv =
    ["slug\tname\tuse_for\tsource_skill_md\texport_skill_md"]
      .concat(
        manifest.map((entry) =>
          [
            entry.slug,
            entry.name,
            entry.useFor,
            entry.skillMdPath,
            entry.relativeSkillMd,
          ].join("\t")
        )
      )
      .join("\n") + "\n";

  const manifestJson = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      sourceCatalog: "HACKATHON_SKILLS.md",
      skillCount: manifest.length,
      installTarget: "~/.codex/skills/hackathon-skills",
      skills: manifest.map((entry) => ({
        slug: entry.slug,
        name: entry.name,
        useFor: entry.useFor,
        sourceSkillMd: entry.skillMdPath,
        exportSkillMd: entry.relativeSkillMd,
      })),
    },
    null,
    2
  );

  const installEntriesSh = manifest
    .map((entry) => `${entry.slug}\t${entry.name.replace(/\t/g, " ")}`)
    .join("\n");

  const installEntriesPs = manifest
    .map(
      (entry) =>
        `    @{ Slug = ${psQuote(entry.slug)}; Name = ${psQuote(entry.name)} }`
    )
    .join(",\n");

  const readme = `# Hackathon Skills Export

This bundle contains ${manifest.length} hackathon-related skills exported from Leo's installed Codex/agent skills.

It was generated from \`HACKATHON_SKILLS.md\` in the \`openai-hackathon\` repo. The bundle includes the original selected skill folders, a manifest, and install scripts for another machine.

## What Is Included

- \`skills/\`: copied skill folders, each containing a \`SKILL.md\`
- \`MANIFEST.tsv\`: simple tab-separated manifest for humans/scripts
- \`manifest.json\`: structured manifest
- \`install.sh\`: macOS/Linux/Git Bash installer
- \`install.ps1\`: Windows PowerShell installer

## Install on macOS or Linux

From this folder:

\`\`\`bash
chmod +x install.sh
./install.sh
\`\`\`

By default, skills are copied to:

\`\`\`text
~/.codex/skills/hackathon-skills
\`\`\`

To install somewhere else:

\`\`\`bash
CODEX_SKILLS_DIR="$HOME/.codex/skills/my-hackathon-skills" ./install.sh
\`\`\`

## Install on Windows PowerShell

From this folder:

\`\`\`powershell
Set-ExecutionPolicy -Scope Process Bypass
.\\install.ps1
\`\`\`

By default, skills are copied to:

\`\`\`text
$HOME\\.codex\\skills\\hackathon-skills
\`\`\`

To install somewhere else:

\`\`\`powershell
.\\install.ps1 -TargetDir "$HOME\\.codex\\skills\\my-hackathon-skills"
\`\`\`

## Important Notes

- Some exported skills are pure instructions and should work after copying.
- Some skills describe plugin-backed or service-backed workflows, such as GitHub, Gmail, OpenAI, Composio/Rube, or Browser. Your friend may still need the relevant plugin, connector, CLI, account login, API key, or MCP server for those workflows to actually run.
- The installer does not delete existing skills. It only copies this bundle into the target folder.
- If a skill with the same folder name already exists in the target, the installer refreshes that exported folder.
`;

  const installSh = `#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="\${CODEX_SKILLS_DIR:-$HOME/.codex/skills/hackathon-skills}"

mkdir -p "$TARGET_DIR"

while IFS=$'\\t' read -r slug name; do
  [ -n "$slug" ] || continue
  rm -rf "$TARGET_DIR/$slug"
  cp -R "$SOURCE_DIR/skills/$slug" "$TARGET_DIR/$slug"
  printf 'Installed %s (%s)\\n' "$slug" "$name"
done <<'SKILL_LIST'
${installEntriesSh}
SKILL_LIST

printf '\\nInstalled %s skills into %s\\n' "${manifest.length}" "$TARGET_DIR"
printf 'Restart Codex or refresh your agent session if the skills do not appear immediately.\\n'
`;

  const installPs = `param(
  [string]$TargetDir = "$HOME\\.codex\\skills\\hackathon-skills"
)

$ErrorActionPreference = "Stop"
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

$Skills = @(
${installEntriesPs}
)

foreach ($Skill in $Skills) {
  $Source = Join-Path $SourceDir ("skills\\" + $Skill.Slug)
  $Destination = Join-Path $TargetDir $Skill.Slug
  if (Test-Path $Destination) {
    Remove-Item -Recurse -Force $Destination
  }
  Copy-Item -Recurse -Path $Source -Destination $Destination
  Write-Host ("Installed {0} ({1})" -f $Skill.Slug, $Skill.Name)
}

Write-Host ""
Write-Host ("Installed {0} skills into {1}" -f $Skills.Count, $TargetDir)
Write-Host "Restart Codex or refresh your agent session if the skills do not appear immediately."
`;

  writeFile(path.join(exportRoot, "README.md"), readme);
  writeFile(path.join(exportRoot, "MANIFEST.tsv"), manifestTsv);
  writeFile(path.join(exportRoot, "manifest.json"), manifestJson);
  writeFile(path.join(exportRoot, "install.sh"), installSh, 0o755);
  writeFile(path.join(exportRoot, "install.ps1"), installPs);

  console.log(`Exported ${manifest.length} skills to ${exportRoot}`);
}

buildExport();
