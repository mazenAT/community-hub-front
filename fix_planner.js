const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf8');

// 1. Add new state variable after selectedWeek line
content = content.replace(
  /const \[selectedWeek, setSelectedWeek\] = useState<string>\("1"\);/,
  `const [selectedWeek, setSelectedWeek] = useState<string>("1");
  const [generalFilter, setGeneralFilter] = useState<"meals" | "daily_items">("meals");`
);

// 2. Remove Week View and Custom Range buttons from header
content = content.replace(
  /        \{\/\* Date Range Selection \*\/}\s*<div className="mt-4 flex flex-wrap gap-2">[\s\S]*?<\/div>\s*\{\/\* Custom Date Range Picker \*\/}[\s\S]*?<\/div>\s*\)\s*\}\s*/,
  ''
);

// 3. Remove pre-order notice from header
content = content.replace(
  /        \{\/\* Pre-Order Warning Message \*\/}[\s\S]*?<\/div>\s*\)\s*\}\s*/,
  ''
);

// 4. Add pre-order notice above family member selection with white background
const preOrderNotice = `        {/* Pre-Order Notice */}
        <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-500">
              <p className="font-medium mb-1">Pre-Order Deadline</p>
              <p>Orders are closed by 11:59 the day before.</p>
            </div>
          </div>
        </div>

`;

content = content.replace(
  /        \{\/\* Combined Filters Section \*\/}/,
  preOrderNotice + '        {/* Combined Filters Section */}'
);

// 5. Replace meal type filter with general filter (always show)
const mealFilterSection = `          {/* Meal Filters - Hidden for nursery meal plans */}
          {!hasNurseryMeals(activePlan) && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30">
              <h3 className="text-sm font-semibold text-brand-black mb-3">Meal Type</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All Meals' },
                    ...categories.filter(cat => cat !== 'all').map(cat => ({
                      key: cat,
                      label: CATEGORY_LABELS[cat as MealCategory] || cat.charAt(0).toUpperCase() + cat.slice(1)
                    }))
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={selectedType === key ? 'default' : 'outline'}
                      size="sm"
                      className={\`\${
                        selectedType === key 
                          ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                          : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
                      } rounded-full px-3 py-1 text-xs font-medium\`}
                      onClick={() => setSelectedType(key as 'all' | 'hot_meal' | 'sandwich' | 'sandwich_xl' | 'burger' | 'crepe' | 'nursery')}
                    >
                      {label}
                    </Button>
                  ))}
              </div>
            </div>
          )}`;

const generalFilterSection = `          {/* General Filter */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-brand-yellow/30">
            <h3 className="text-sm font-semibold text-brand-black mb-3">Filter</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={generalFilter === "meals" ? 'default' : 'outline'}
                size="sm"
                className={\`\${
                  generalFilter === "meals" 
                    ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                    : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
                } rounded-full px-4 py-2 text-sm font-medium\`}
                onClick={() => setGeneralFilter("meals")}
              >
                Food/Sandwich
              </Button>
              <Button
                variant={generalFilter === "daily_items" ? 'default' : 'outline'}
                size="sm"
                className={\`\${
                  generalFilter === "daily_items" 
                    ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red/90' 
                    : 'bg-white text-brand-black border-brand-red hover:bg-brand-red/10'
                } rounded-full px-4 py-2 text-sm font-medium\`}
                onClick={() => setGeneralFilter("daily_items")}
              >
                Daily Items
              </Button>
            </div>
          </div>`;

content = content.replace(mealFilterSection, generalFilterSection);

// 6. Add custom range filter next to week buttons
const customRangeFilter = `
            {/* Custom Range Filter */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-brand-black mb-2">Custom Date Range</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white text-brand-black border-brand-red hover:bg-brand-red/10"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {customStartDate ? format(customStartDate, "MMM dd") : "Start Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        setCustomStartDate(date);
                        if (customEndDate && date && customEndDate < date) {
                          setCustomEndDate(undefined);
                        }
                        setViewMode("custom");
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <span className="text-brand-black/60">to</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white text-brand-black border-brand-red hover:bg-brand-red/10"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {customEndDate ? format(customEndDate, "MMM dd") : "End Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        setCustomEndDate(date);
                        setViewMode("custom");
                      }}
                      disabled={(date) => {
                        return customStartDate ? date < customStartDate : false;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>`;

// Find the end of the week selection section and add custom range filter
content = content.replace(
  /(\s+)}\n(\s+)}\n(\s+)}\n(\s+}<\/div>)\n\n(\s+){\/\* General Filter/,
  `$1}$2}$3}${customRangeFilter}$4

$5{/* General Filter`
);

// 7. Update content display logic to respect generalFilter
// Hide meals section when generalFilter is "daily_items"
content = content.replace(
  /        \{\/\* Meal Planner Cards \*\/}/,
  `        {/* Meal Planner Cards */}
        {generalFilter === "meals" && (`
);

// Find the end of meal planner cards section and close the conditional
content = content.replace(
  /        \{\/\* Dedicated Daily Items Ordering Card/,
  `        )}

        {/* Dedicated Daily Items Ordering Card`
);

// Hide daily items section when generalFilter is "meals"
content = content.replace(
  /        \{\/\* Dedicated Daily Items Ordering Card - Hidden for nursery meal plans \*\/}/,
  `        {/* Dedicated Daily Items Ordering Card */}
        {generalFilter === "daily_items" && (`
);

// Find the end of daily items section and close the conditional
content = content.replace(
  /        \}\n\n\n        <\/div>/,
  `        )}

        </div>`
);

// Write the file back
fs.writeFileSync('src/pages/Planner.tsx', content);
// File updated successfully
