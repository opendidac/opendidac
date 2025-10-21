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
import {
  DatabaseQueryOutputTest,
  DatabaseQueryOutputType,
} from '@prisma/client'
import _ from 'lodash'

const convertAllCellsToString = (rows) =>
  rows.map((row) => row.map((cell) => String(cell)))

// Removes columns from dataset2 that are not present in dataset
const removeColumnTypes = (dataset) => {
  dataset.rows = convertAllCellsToString(dataset.rows)
  const newColumns = dataset.columns.map((column) => {
    const { type, ...rest } = column // Destructure out the 'type' key
    return rest
  })

  return {
    columns: newColumns,
    rows: dataset.rows,
  }
}

// Removes columns from dataset2 that are not present in dataset1
const removeExtraColumns = (dataset1, dataset2) => {
  const dataset1ColumnNames = dataset1.columns.map((col) => col.name)
  const dataset2ColumnIndexesToRemove = []

  dataset2.columns.forEach((col, index) => {
    if (!dataset1ColumnNames.includes(col.name)) {
      dataset2ColumnIndexesToRemove.push(index)
    }
  })

  const prunedColumns = dataset2.columns.filter(
    (col, index) => !dataset2ColumnIndexesToRemove.includes(index),
  )

  const prunedRows = dataset2.rows.map((row) => {
    return row.filter(
      (cell, index) => !dataset2ColumnIndexesToRemove.includes(index),
    )
  })

  return {
    columns: prunedColumns,
    rows: prunedRows,
  }
}

// Sort columns and rearrange columns in each row
const sortDatasetColumns = (dataset) => {
  const sortedColumns = [...dataset.columns].sort((a, b) =>
    a.name.localeCompare(b.name),
  )
  const colIndexMapping = {}

  for (let i = 0; i < sortedColumns.length; i++) {
    colIndexMapping[sortedColumns[i].name] = dataset.columns.findIndex(
      (col) => col.name === sortedColumns[i].name,
    )
  }

  const sortedRows = dataset.rows.map((row) => {
    const newRow = []
    sortedColumns.forEach((col, index) => {
      newRow[index] = row[colIndexMapping[col.name]]
    })
    return newRow
  })

  return {
    columns: sortedColumns,
    rows: sortedRows,
  }
}

// Sort rows based on the values in the rows
const sortDatasetRows = (dataset) => {
  const sortedRows = [...dataset.rows].sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b)),
  )
  return {
    columns: dataset.columns,
    rows: sortedRows,
  }
}

const runTestsOnDatasets = (d1, d2, outputTests) => {
  if (outputTests.includes(DatabaseQueryOutputTest.IGNORE_EXTRA_COLUMNS)) {
    d2 = removeExtraColumns(d1, d2)
  }

  if (outputTests.includes(DatabaseQueryOutputTest.INGORE_COLUMN_TYPES)) {
    d1 = removeColumnTypes(d1)
    d2 = removeColumnTypes(d2)
  }

  if (outputTests.includes(DatabaseQueryOutputTest.IGNORE_COLUMN_ORDER)) {
    d1 = sortDatasetColumns(d1)
    d2 = sortDatasetColumns(d2)
  }

  if (outputTests.includes(DatabaseQueryOutputTest.IGNORE_ROW_ORDER)) {
    d1 = sortDatasetRows(d1)
    d2 = sortDatasetRows(d2)
  }

  return _.isEqual(d1, d2)
}

/*
    PostgreSQL output to dataset
    Used to transform the output of a PostgreSQL query to a dataset that can be used for testing
* */
const postgresOutputToToDataset = (pgData) => {
  const dataset = {
    columns: [],
    rows: [],
  }

  // Create a reverse mapping from dataTypeID to type key
  const reverseTypeMapping = {}
  for (const [key, value] of Object.entries(pgData._types._types.builtins)) {
    reverseTypeMapping[value] = key
  }

  // Transform fields to columns in metadata
  dataset.columns = pgData.fields.map((field) => {
    return {
      name: field.name,
      type: reverseTypeMapping[field.dataTypeID] || field.format,
    }
  })

  // Transform rows
  for (const row of pgData.rows) {
    const dataRow = []
    for (const column of dataset.columns) {
      const valueType = row[column.name]?.constructor?.name || 'String'
      switch (valueType) {
        case 'Date':
          dataRow.push(row[column.name].toISOString())
          break
        case 'Boolean':
          dataRow.push(row[column.name] ? 'true' : 'false')
          break
        default:
          dataRow.push(row[column.name])
      }
    }
    dataset.rows.push(dataRow)
  }

  return dataset
}

const postgresDetermineOutputType = (result) => {
  const rowCount = result.rows.length
  const fieldCount = result.fields.length
  if (fieldCount > 1 || (fieldCount === 1 && rowCount > 1)) {
    return DatabaseQueryOutputType.TABULAR
  }

  if (fieldCount === 1 && rowCount === 1) {
    return DatabaseQueryOutputType.SCALAR
  }

  return DatabaseQueryOutputType.TEXT
}

const postgresGenerateFeedbackMessage = (command, result) => {
  const { rowCount } = result

  const message = `${command} operation executed.`
  if (rowCount) {
    return `${message} ${rowCount} row${rowCount > 1 ? 's' : ''} affected.`
  }

  if (command === 'SELECT') {
    // for SELECT queries, we display the number of rows returned even if it is 0
    return `${message} ${rowCount} row${rowCount > 1 ? 's' : ''} returned.`
  }

  return message
}

export {
  runTestsOnDatasets,
  postgresOutputToToDataset,
  postgresDetermineOutputType,
  postgresGenerateFeedbackMessage,
}
