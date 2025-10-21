/**
 * Copyright 2022-2024 HEIG-VD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

const AcademicYearSelector = ({
  selectedYear,
  onYearChange,
  availableYears,
}) => {
  return (
    <FormControl fullWidth sx={{ minWidth: 200 }}>
      <InputLabel>Academic Year</InputLabel>
      <Select
        value={selectedYear}
        label="Academic Year"
        onChange={(e) => onYearChange(e.target.value)}
      >
        {availableYears.map((year) => (
          <MenuItem key={year.value} value={year.value}>
            {year.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default AcademicYearSelector
