import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Static architecture contract for the SDKWork Agents HarmonyOS mobile root.
 *
 * Authority: `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 11
 * (root layout / package naming / root thinness / SDK boundary) and
 * `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`.
 *
 * The parity invariants at the end of this file encode
 * `specs/client-page-parity.spec.json` for this root: the contract-declared
 * registry file must carry every canonical route id, the typed shell route id
 * constants must not drift from it, every M1 page must resolve to a real screen
 * file, and every router-opened page must be registered by route id.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(root, "..", "..");

function mustExist(relativePath) {
  const absolute = path.join(root, relativePath);
  assert.ok(fs.existsSync(absolute), `${relativePath} must exist`);
  return fs.readFileSync(absolute, "utf8");
}

function listFiles(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const childRelative = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "build", "oh_modules", ".hvigor"].includes(entry.name)) return [];
      return listFiles(childRelative);
    }
    return [childRelative];
  });
}

function readJson(relativePath) {
  return JSON.parse(mustExist(relativePath));
}

// --- Root layout -----------------------------------------------------------

for (const requiredPath of [
  "AGENTS.md",
  "README.md",
  "agent.app.config.json",
  "specs/component.spec.json",
  "oh-package.json5",
  "build-profile.json5",
  "hvigorfile.ts",
  ".sdkwork/README.md",
  ".sdkwork/skills/README.md",
  ".sdkwork/plugins/README.md",
  "etc/README.md",
  "etc/sdkwork.deployment.config.json",
  "AppScope/app.json5",
  "entry/oh-package.json5",
  "entry/build-profile.json5",
  "entry/src/main/module.json5",
  "entry/src/main/ets/entryability/EntryAbility.ets",
  "sdks/README.md",
  "scripts/README.md",
]) {
  mustExist(requiredPath);
}

// --- Package family --------------------------------------------------------

const expectedPackages = [
  "sdkwork-agents-harmony-mobile-core",
  "sdkwork-agents-harmony-mobile-commons",
  "sdkwork-agents-harmony-mobile-shell",
  "sdkwork-agents-harmony-mobile-host",
  "sdkwork-agents-harmony-mobile-agents",
  "sdkwork-agents-harmony-mobile-inspiration",
  "sdkwork-agents-harmony-mobile-creative",
  "sdkwork-agents-harmony-mobile-assets",
  "sdkwork-agents-harmony-mobile-membership",
  "sdkwork-agents-harmony-mobile-profile",
];

for (const packageName of expectedPackages) {
  const packageRoot = `packages/${packageName}`;
  mustExist(`${packageRoot}/oh-package.json5`);
  mustExist(`${packageRoot}/build-profile.json5`);
  mustExist(`${packageRoot}/src/main/module.json5`);
  mustExist(`${packageRoot}/src/main/ets/Index.ets`);
  const componentSpec = JSON.parse(mustExist(`${packageRoot}/specs/component.spec.json`));
  assert.equal(
    componentSpec.component?.root,
    `apps/sdkwork-agents-harmony-mobile/packages/${packageName}`,
    `${packageName} component spec root must use the canonical HarmonyOS package path`,
  );
  assert.ok(
    fs.existsSync(path.join(root, packageRoot, "specs/component.spec.json")),
    `${packageName} must declare a component spec`,
  );
}

// --- Component spec layer roles -------------------------------------------

const allowedLayerRoles = new Set([
  "contract",
  "frontend-core",
  "frontend-shell",
  "frontend-feature",
  "frontend-commons",
  "frontend-host",
  "backend-route",
  "backend-service",
  "backend-domain",
  "backend-repository",
  "backend-provider",
  "runtime-api-server",
  "runtime-service-host",
  "runtime-composition",
  "runtime-gateway",
  "runtime-native-host",
  "sdk-facade",
  "sdk-generated",
  "tooling",
]);

for (const packageName of expectedPackages) {
  const componentSpec = JSON.parse(
    mustExist(`packages/${packageName}/specs/component.spec.json`),
  );
  const layerRole = componentSpec.contracts?.layerRole;
  if (layerRole !== undefined) {
    assert.ok(
      allowedLayerRoles.has(layerRole),
      `${packageName} contracts.layerRole ${JSON.stringify(layerRole)} is not an allowed composable layer role`,
    );
  }
}

// --- Root thinness ---------------------------------------------------------

const entryFiles = listFiles("entry/src/main/ets");
const businessOwnedEntryFiles = entryFiles.filter((filePath) => {
  const normalized = filePath.replaceAll("\\", "/");
  return /\/pages\/(?!Index\.ets|__generated__)/u.test(normalized);
});
assert.deepEqual(
  businessOwnedEntryFiles,
  [],
  "root entry/ must stay thin: business pages belong in capability packages",
);

// --- Config -----------------------------------------------------------------

for (const deploymentProfile of ["standalone", "cloud"]) {
  for (const environment of ["development", "test", "staging", "production"]) {
    const profileId = `${deploymentProfile}.${environment}`;
    const runtimeConfig = JSON.parse(
      mustExist(`config/app/runtime-env.${profileId}.json`),
    );
    assert.equal(runtimeConfig.profileId, profileId, `${profileId} must declare its profileId`);
    assert.equal(
      runtimeConfig.deploymentProfile,
      deploymentProfile,
      `${profileId} must declare deploymentProfile=${deploymentProfile}`,
    );
    assert.equal(runtimeConfig.environment, environment, `${profileId} must declare environment=${environment}`);
    assert.equal(
      runtimeConfig.runtimeTarget,
      "harmony-native",
      `${profileId} must declare runtimeTarget=harmony-native`,
    );
  }
}

// --- Host config must stay secret-free -------------------------------------

const hostConfigFiles = listFiles("config/host");
assert.ok(hostConfigFiles.length > 0, "config/host must contain checked-in templates");
const secretPattern = /(signingPrivateKey|privateKey|refreshToken|apiKey|databaseUrl|password)\s*[:=]\s*["'][^"'<]/iu;
for (const hostFile of hostConfigFiles) {
  const content = mustExist(hostFile);
  assert.doesNotMatch(content, secretPattern, `${hostFile} must not contain secrets`);
}

// --- App manifest ----------------------------------------------------------

const manifest = readJson("agent.app.config.json");
assert.equal(manifest.app?.appType, "APP_HARMONY", "Harmony root must declare appType APP_HARMONY");
assert.equal(manifest.runtime?.family, "mobile", "Harmony root must declare runtime.family mobile");
assert.equal(
  manifest.runtime?.framework,
  "harmony-native",
  "Harmony root must declare runtime.framework harmony-native",
);
assert.ok(
  manifest.publish?.platforms?.includes("APP_HARMONY"),
  "Harmony root must publish for APP_HARMONY",
);

// --- SDK boundary ----------------------------------------------------------

const featureSource = listFiles("packages/sdkwork-agents-harmony-mobile-agents/src")
  .filter((filePath) => filePath.endsWith(".ets"))
  .map((filePath) => mustExist(filePath))
  .join("\n");
assert.doesNotMatch(
  featureSource,
  /@ohos\.net\.http|http\.createHttp|fetch\(/u,
  "capability packages must not perform raw HTTP transport",
);

// No capability package may bypass the app SDK port with raw transport.
for (const packageName of expectedPackages) {
  if (!packageName.includes("-mobile-")) continue;
  if (packageName.endsWith("-core") || packageName.endsWith("-commons") ||
    packageName.endsWith("-shell") || packageName.endsWith("-host")) {
    continue;
  }
  const capabilitySource = listFiles(`packages/${packageName}/src`)
    .filter((filePath) => /\.(?:ets|ts)$/u.test(filePath))
    .map((filePath) => mustExist(filePath))
    .join("\n");
  assert.doesNotMatch(
    capabilitySource,
    /@ohos\.net\.http|http\.createHttp|fetch\(|XMLHttpRequest/u,
    `${packageName} must consume the injected app SDK port instead of raw HTTP`,
  );
  assert.doesNotMatch(
    capabilitySource,
    /@kit\.AbilityKit|@kit\.ArkUI|@kit\.ArkData|@kit\.LocalizationKit/u,
    `${packageName} must not call HarmonyOS platform kits directly; use host adapters`,
  );
}

// --- Page parity contract --------------------------------------------------

const parityContractPath = path.join(repoRoot, "specs", "client-page-parity.spec.json");
const parityContract = JSON.parse(fs.readFileSync(parityContractPath, "utf8"));
const harmonyClient = parityContract.clients.harmony;
assert.equal(
  harmonyClient.root,
  "apps/sdkwork-agents-harmony-mobile",
  "the parity contract must still point at this root",
);
assert.deepEqual(
  harmonyClient.registry,
  ["apps/sdkwork-agents-harmony-mobile/packages/sdkwork-agents-harmony-mobile-agents/src/main/ets/routes/RouteContributions.ets"],
  "the parity contract registry path must resolve to the agents route contributions file",
);

const registrySource = mustExist(
  "packages/sdkwork-agents-harmony-mobile-agents/src/main/ets/routes/RouteContributions.ets",
);
const routeIdsSource = mustExist(
  "packages/sdkwork-agents-harmony-mobile-shell/src/main/ets/navigation/RouteIds.ets",
);

/** Parses the registry entries (id/titleKey/pagePath/presentation/pageStatus). */
const registryEntries = registrySource
  .split("\n  {")
  .slice(1)
  .map((chunk) => {
    const id = /id: '(app\.agents\.[a-z0-9.]+)'/u.exec(chunk)?.[1];
    if (!id) return null;
    return {
      id,
      titleKey: /titleKey: '([^']+)'/u.exec(chunk)?.[1],
      pagePath: /pagePath: '([^']+)'/u.exec(chunk)?.[1],
      presentation: /presentation: '([a-z]+)'/u.exec(chunk)?.[1],
      pageStatus: /pageStatus: '([a-z]+)'/u.exec(chunk)?.[1],
    };
  })
  .filter(Boolean);

const registryIds = registryEntries.map((entry) => entry.id);
const contractIds = parityContract.pages.map((page) => page.id);

assert.deepEqual(
  [...registryIds].sort(),
  [...contractIds].sort(),
  "the Harmony route registry must declare exactly the contract page ids",
);

const typedRouteIds = [...routeIdsSource.matchAll(/'(app\.agents\.[a-z0-9.]+)'/gu)].map((match) => match[1]);
assert.deepEqual(
  [...new Set(typedRouteIds)].sort(),
  [...registryIds].sort(),
  "shell RouteIds constants and the contract registry must declare the same route ids",
);

const m1Pages = parityContract.pages.filter((page) => page.requiredFrom === "M1");
for (const page of m1Pages) {
  const entry = registryEntries.find((candidate) => candidate.id === page.id);
  assert.ok(entry, `${page.id} must be declared in the Harmony route registry`);
  assert.equal(entry.titleKey, page.titleKey, `${page.id} titleKey must match the parity contract`);
  assert.equal(
    entry.presentation,
    page.harmony.presentation,
    `${page.id} presentation must match the parity contract`,
  );
  assert.equal(entry.pageStatus, "delivered", `${page.id} must be delivered in this milestone`);
  assert.ok(entry.pagePath, `${page.id} must declare a physical Harmony page path`);

  const candidatePageFiles = listFiles("packages").filter((filePath) => {
    const normalized = filePath.replaceAll("\\", "/");
    return normalized.endsWith(`/src/main/ets/${entry.pagePath}.ets`);
  });
  assert.equal(
    candidatePageFiles.length,
    1,
    `${page.id} page path ${entry.pagePath}.ets must exist in exactly one capability package`,
  );
}

// Router-opened surfaces must be registered by canonical route id so the shell
// navigator can resolve them through `router.pushNamedRoute`.
const routerOpenedEntries = registryEntries.filter(
  (entry) => entry.pageStatus === "delivered" && entry.presentation !== "tab",
);
assert.ok(
  routerOpenedEntries.length >= 3,
  "membership, profile, and settings must be router-reachable in this milestone",
);
for (const entry of routerOpenedEntries) {
  const pageFile = listFiles("packages").find((filePath) => {
    const normalized = filePath.replaceAll("\\", "/");
    return normalized.endsWith(`/src/main/ets/${entry.pagePath}.ets`);
  });
  assert.ok(pageFile, `${entry.id} must resolve to a page file`);
  const packagePath = pageFile.replaceAll("\\", "/").split("/src/main/ets/")[0];
  const routeMap = JSON.parse(
    mustExist(`${packagePath}/src/main/resources/base/profile/route_map.json`),
  );
  const routeMapEntry = routeMap.routerMap?.find((candidate) => candidate.name === entry.id);
  assert.ok(routeMapEntry, `${entry.id} must be registered in ${packagePath} route_map.json by route id`);
  assert.ok(
    routeMapEntry.pageSourceFile.endsWith(`${entry.pagePath}.ets`),
    `${entry.id} route map entry must point at ${entry.pagePath}.ets`,
  );
  const mainPages = JSON.parse(
    mustExist(`${packagePath}/src/main/resources/base/profile/main_pages.json`),
  );
  assert.ok(
    mainPages.src?.includes(entry.pagePath),
    `${entry.id} page must be listed in ${packagePath} main_pages.json`,
  );
  const pageSource = mustExist(pageFile);
  assert.match(
    pageSource,
    new RegExp(`@Builder\\s+export function\\s+${routeMapEntry.buildFunction}`, "u"),
    `${entry.id} must export the route map build function ${routeMapEntry.buildFunction}`,
  );
}

// The mobile navigation model must stay identical to the contract.
const routeStackSource = mustExist(
  "packages/sdkwork-agents-harmony-mobile-shell/src/main/ets/navigation/RouteStack.ets",
);
const tabRouteIds = [...routeStackSource.matchAll(/routeId: (CONVERSATION_CHAT_ROUTE_ID|INSPIRATION_DISCOVER_ROUTE_ID|CREATIVE_STUDIO_ROUTE_ID|ASSETS_LIST_ROUTE_ID|AGENT_CATALOG_LIST_ROUTE_ID)/gu)]
  .map((match) => match[1]);
assert.deepEqual(
  [...new Set(tabRouteIds)],
  [
    "CONVERSATION_CHAT_ROUTE_ID",
    "INSPIRATION_DISCOVER_ROUTE_ID",
    "CREATIVE_STUDIO_ROUTE_ID",
    "ASSETS_LIST_ROUTE_ID",
    "AGENT_CATALOG_LIST_ROUTE_ID",
  ],
  "the shell tab model must declare the five PC-primary surfaces in contract order",
);

const profileLinksBlock = /AGENTS_HARMONY_PROFILE_LINK_ROUTE_IDS: string\[\] = \[([\s\S]*?)\];/u.exec(routeStackSource)?.[1] ?? "";
const profileLinkIds = [...profileLinksBlock.matchAll(/'(app\.agents\.[a-z0-9.]+)'/gu)].map((match) => match[1]);
assert.deepEqual(
  profileLinkIds,
  parityContract.navigation.mobileProfileLinks,
  "profile hub links must match the parity contract order",
);
const profileEntryId = /PROFILE_INDEX_ROUTE_ID: string = '(app\.agents\.[a-z0-9.]+)'/u.exec(routeIdsSource)?.[1];
assert.equal(
  profileEntryId,
  parityContract.navigation.mobileProfileEntry,
  "the profile entry route id constant must match the parity contract",
);
assert.match(
  routeStackSource,
  /AGENTS_HARMONY_PROFILE_ENTRY_ROUTE_ID: string = PROFILE_INDEX_ROUTE_ID/u,
  "the shell must expose the profile entry through the typed route id constant",
);

console.log("harmony surface contract passed.");
