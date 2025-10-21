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
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Stack,
} from '@mui/material'

const CardSelector = ({ options, selected, onSelect }) => {
  return (
    <Stack spacing={2} direction={'row'} width={'100%'}>
      {options.map((option) => (
        <Card
          key={option.value}
          variant="outlined"
          sx={{
            borderColor:
              selected === option.value ? 'primary.main' : 'grey.300',
            borderWidth: 2,
            flex: 1,
          }}
          onClick={() => onSelect(option.value)}
        >
          <CardActionArea
            sx={{ height: '100%', display: 'flex', alignItems: 'flex-start' }}
          >
            <CardContent>
              <Typography variant="h6">{option.label}</Typography>
              <Typography variant="body2">{option.description}</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  )
}

export default CardSelector
