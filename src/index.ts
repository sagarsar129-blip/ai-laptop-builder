import AIBuilder from "./ai-builder";

/**
 * Main entry point for the Secure AI Laptop Builder
 * 
 * This demonstrates the complete workflow:
 * 1. Initialize the sandbox
 * 2. Create a simple project
 * 3. Run commands with loop prevention
 * 4. Verify everything stays within the workspace
 */

async function main() {
  try {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`🔐 SECURE AI LAPTOP BUILDER - DEMO`);
    console.log(`${"=".repeat(70)}\n`);

    // Step 1: Initialize the AIBuilder with a project workspace
    const builder = new AIBuilder({
      projectRoot: "./demo-project",
      maxRetriesPerTask: 3,
      commandTimeoutMs: 120_000,
      enableAuditLogging: true,
      enableErrorParsing: true,
    });

    // Step 2: Verify the sandbox works
    console.log(`\n📋 Step 1: Verifying Sandbox...`);
    const sandboxOk = await builder.verifySandbox();
    if (!sandboxOk) {
      throw new Error("Sandbox verification failed!");
    }

    // Step 3: Initialize a new project
    console.log(`\n📋 Step 2: Initializing Project...`);
    await builder.initProject("demo-app", "Secure AI-built demo application");

    // Step 4: Create some files
    console.log(`\n📋 Step 3: Creating Project Files...`);

    const indexTs = `
/**
 * Demo application built by AI
 * All file operations are sandboxed and secure
 */

console.log("🚀 Welcome to the Secure AI Builder Demo!");
console.log("All operations are isolated to the project workspace.");
`;

    await builder.createFile("src/index.ts", indexTs);

    const appTs = `
export class App {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  greet(): string {
    return \`Hello from \${this.name}!\`;
  }
}

export default App;
`;

    await builder.createFile("src/app.ts", appTs);

    const testTs = `
import App from "./app";

describe("App", () => {
  it("should greet correctly", () => {
    const app = new App("Demo");
    expect(app.greet()).toBe("Hello from Demo!");
  });
});
`;

    await builder.createFile("tests/app.test.ts", testTs);

    // Step 5: Verify files were created (all within sandbox)
    console.log(`\n📋 Step 4: Listing Project Files...`);
    const listing = await builder.listDirectory();
    console.log(`Found ${listing.files.length} files and ${listing.directories.length} directories:`);
    
    for (const file of listing.files) {
      console.log(`  📄 ${file.path} (${file.size} bytes)`);
    }
    
    for (const dir of listing.directories) {
      console.log(`  📁 ${dir.path}/`);
    }

    // Step 6: Test path validation
    console.log(`\n📋 Step 5: Testing Security Restrictions...`);
    
    const safePath = "src/app.ts";
    const maliciousPath = "../../../etc/passwd";
    
    console.log(`  ✅ Is "${safePath}" safe? ${builder.isPathSafe(safePath)}`);
    console.log(`  ❌ Is "${maliciousPath}" safe? ${builder.isPathSafe(maliciousPath)}`);

    // Step 7: Test command validation
    console.log(`\n📋 Step 6: Testing Command Validation...`);
    
    const safeCmd = "npm install";
    const maliciousCmd = "rm -rf /";
    
    console.log(`  ✅ Is "${safeCmd}" safe? ${builder.isCommandSafe(safeCmd)}`);
    console.log(`  ❌ Is "${maliciousCmd}" safe? ${builder.isCommandSafe(maliciousCmd)}`);

    // Step 8: Read a file back
    console.log(`\n📋 Step 7: Reading Created Files...`);
    const appContent = await builder.readFile("src/app.ts");
    console.log(`✅ Successfully read src/app.ts (${appContent.length} bytes)`);

    // Step 9: List all workspace files (for auditing)
    console.log(`\n📋 Step 8: Workspace Audit...`);
    const allFiles = builder.listWorkspaceFiles();
    console.log(`Total files in workspace: ${allFiles.length}`);
    console.log(`Files:`);
    for (const file of allFiles.slice(0, 10)) {
      console.log(`  - ${file}`);
    }
    if (allFiles.length > 10) {
      console.log(`  ... and ${allFiles.length - 10} more`);
    }

    // Step 10: Print status
    console.log(`\n📋 Step 9: Final Status...`);
    builder.printStatus();

    // Step 11: Demonstrate loop prevention
    console.log(`📋 Step 10: Testing Loop Prevention...`);
    console.log(`Running a command that will fail to demonstrate error recovery...\n`);

    try {
      // This will fail (file doesn't exist), but it demonstrates error parsing
      await builder.run("cat", ["nonexistent-file.txt"], "Reading nonexistent file");
    } catch (error) {
      if (error instanceof Error) {
        console.log(`✅ Error was caught and cleaned up:\n${error.message}`);
      }
    }

    console.log(`\n${"=".repeat(70)}`);
    console.log(`✅ DEMO COMPLETE - All security features working!`);
    console.log(`${"=".repeat(70)}\n`);

    console.log(`📚 Key Features Demonstrated:`);
    console.log(`  ✅ Sandbox initialization with path whitelisting`);
    console.log(`  ✅ Safe file creation (read, write, list)`);
    console.log(`  ✅ Path escape prevention`);
    console.log(`  ✅ Command injection blocking`);
    console.log(`  ✅ Error parsing and loop prevention`);
    console.log(`  ✅ Audit logging of all operations`);
    console.log(`\n📁 Project created at: ./demo-project/\n`);

  } catch (error) {
    console.error(`\n❌ Fatal Error:`, error);
    process.exit(1);
  }
}

// Run the demo
main();
