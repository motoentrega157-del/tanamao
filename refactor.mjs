import { Project } from 'ts-morph';
import fs from 'fs';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
const sourceFile = project.getSourceFileOrThrow('src/App.tsx');

const dirs = ['src/screens', 'src/components', 'src/types', 'src/utils', 'src/context'];
dirs.forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir); });

// 1. Extract Types
const typesFile = project.createSourceFile('src/types/index.ts', "import { Timestamp } from 'firebase/firestore';\n", { overwrite: true });
sourceFile.getInterfaces().forEach(i => {
    i.setIsExported(true);
    typesFile.addInterface(i.getStructure());
    i.remove();
});
sourceFile.getTypeAliases().forEach(t => {
    t.setIsExported(true);
    typesFile.addTypeAlias(t.getStructure());
    t.remove();
});
typesFile.saveSync();

// 2. Add Type Imports to App.tsx
sourceFile.addImportDeclaration({
    moduleSpecifier: './types',
    namedImports: typesFile.getInterfaces().map(i => i.getName()).concat(typesFile.getTypeAliases().map(t => t.getName()))
});

// We need to keep this simple. Instead of extracting EVERYTHING and causing circular imports,
// Let's just create `src/screens` and move screens, exporting shared vars from App.tsx.

const screens = [
  'SplashScreen', 'LandingScreen', 'RoleSelectionScreen', 'LoginScreen', 'RegistrationScreen',
  'AdminDashboard', 'HomeScreen', 'NewRideScreen', 'ActivitiesScreen', 'PaymentsScreen', 'MerchantProfileScreen',
  'DetailsScreen', 'SearchingScreen', 'TrackingScreen', 'CourierAvailableScreen', 'CourierTrackingScreen',
  'CourierEarningsScreen', 'CourierConfirmationScreen', 'CourierProfileScreen'
];

let appImportsFromScreens = [];

// Export all shared variables and functions from App so screens can import them
['ASSETS', 'AuthContext', 'OperationType'].forEach(name => {
    const v = sourceFile.getVariableStatement(name);
    if (v) v.setIsExported(true);
    const m = sourceFile.getEnum(name);
    if (m) m.setIsExported(true);
});

sourceFile.getFunctions().forEach(f => {
    if (f.getName() !== 'App' && !screens.includes(f.getName())) {
        f.setIsExported(true);
    }
});

const sharedFuncs = sourceFile.getFunctions()
    .filter(f => f.getName() !== 'App' && !screens.includes(f.getName()))
    .map(f => f.getName());

const sharedVars = ['ASSETS', 'AuthContext', 'OperationType'];

for (const screen of screens) {
    const func = sourceFile.getFunction(screen);
    if (func) {
        const text = func.getText();
        func.remove();
        
        // Grab all original imports and fix local relative paths
        let importsText = sourceFile.getImportDeclarations().map(i => i.getText()).join('\n');
        importsText = importsText.replace(/from '\.\//g, "from '../");
        importsText = importsText.replace(/from "\.\//g, 'from "../');
        
        let fileContent = importsText + '\n';
        fileContent += `import { ${typesFile.getInterfaces().map(i=>i.getName()).join(', ')}, ${typesFile.getTypeAliases().map(t=>t.getName()).join(', ')} } from '../types';\n`;
        fileContent += `import { ${sharedFuncs.concat(sharedVars).join(', ')} } from '../App';\n\n`;
        fileContent += `export default ${text}`;
        
        fs.writeFileSync(`src/screens/${screen}.tsx`, fileContent);
        appImportsFromScreens.push(`import ${screen} from './screens/${screen}';`);
    }
}

// Add statements to App.tsx
const appFileContent = fs.readFileSync('src/App.tsx', 'utf8');
const newAppContent = appImportsFromScreens.join('\n') + '\n' + appFileContent;
fs.writeFileSync('src/App.tsx', newAppContent);

project.saveSync();
console.log("Refactoring complete");
