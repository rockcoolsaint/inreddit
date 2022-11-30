import { FormControl, FormLabel, Input, FormErrorMessage, Box, Button } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { handleClientScriptLoad } from 'next/script';
import React from 'react'
import InputField from '../components/InputField';
import Wrapper from '../components/Wrapper';

interface registerProps {

}

const Register: React.FC<registerProps> = ({}) => {
  return (
    <Wrapper variant={'small'}>
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="username"
              placeholder="username"
              label="username"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="password"
                type="password"
              />
            </Box>
            <Button
            mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="teal"
            >
              register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
}

export default Register;