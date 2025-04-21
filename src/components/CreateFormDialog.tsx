import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  View,
  Heading,
  Text,
  TextField,
  TextAreaField,
  SelectField,
  Flex,
  Alert,
} from "@aws-amplify/ui-react";
import { IoIosCreate } from "react-icons/io";
import { FaSave } from "react-icons/fa";
import {
  GetClients,
  GetProjectsFromClientName,
  CreateForm,
} from "../actions/form";

interface CreateFormDialogProps {
  onFormCreated: () => void;
}

const CreateFormDialog: React.FC<CreateFormDialogProps> = ({
  onFormCreated,
}) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [projID, setProjID] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchClients = async () => {
      const clientsData = await GetClients();
      setClients(clientsData.clientNames);
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (selectedClient) {
        const { projectNames } =
          await GetProjectsFromClientName(selectedClient);
        setProjects(projectNames);
      } else {
        setProjects([]);
      }
    };
    fetchProjects();
  }, [selectedClient]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCreateForm = async () => {
    try {
      setError(null);
      if (!name || !description || !projID) {
        setError("Please fill in all fields.");
        return;
      }

      const formId = await CreateForm(name, description, projID);
      if (!formId) throw new Error("Form ID not returned");

      const projectID = formId.projID;
      setSuccess("Form created successfully!");
      onFormCreated?.();
      setIsOpen(false);

      navigate(`/form-builder/${formId.formId}`, {
        state: {
          idform: formId.formId,
          name,
          description,
          projID,
          projectID,
          client: selectedClient,
        },
      });
    } catch (err) {
      console.error("Error creating form:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    }
  };

  return (
    <View>
      <Flex justifyContent="center">
        <Button
          style={{ alignItems: "center", height: "120px", width: "300px" }}
          variation="primary"
          size="large"
          onClick={() => setIsOpen(true)}
        >
          <IoIosCreate /> Create Form
        </Button>
      </Flex>

      {isOpen && (
        <View
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          backgroundColor="rgba(0,0,0,0.5)"
          display="flex"
          style={{ alignItems: "center", justifyContent: "center", zIndex: 50 }}
        >
          <View
            ref={dialogRef}
            backgroundColor="white"
            padding="2rem"
            borderRadius="medium"
            width="90%"
            maxWidth="600px"
            boxShadow="0 4px 12px rgba(0,0,0,0.2)"
          >
            <Flex
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              marginBottom="1rem"
            >
              <Heading level={3}>Create New Form</Heading>
              <Button variation="link" onClick={() => setIsOpen(false)}>
                ✕
              </Button>
            </Flex>

            <Text marginBottom="1rem">Add details to create your form</Text>

            {error && (
              <Alert variation="error" isDismissible>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variation="success" isDismissible>
                {success}
              </Alert>
            )}

            <SelectField
              label="Client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              placeholder="Select Client"
            >
              {clients.map((client, idx) => (
                <option key={idx} value={client}>
                  {client}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Project Name"
              value={projID}
              onChange={(e) => setProjID(e.target.value)}
              placeholder="Select Project"
            >
              {projects.map((project, idx) => (
                <option key={idx} value={project}>
                  {project}
                </option>
              ))}
            </SelectField>

            <TextField
              label="Form Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter form name"
            />

            <TextAreaField
              label="Form Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={4}
              resize="vertical"
            />

            <Flex justifyContent="flex-end" marginTop="1rem">
              <Button variation="primary" onClick={handleCreateForm}>
                <FaSave /> Create Form
              </Button>
            </Flex>
          </View>
        </View>
      )}
    </View>
  );
};

export default CreateFormDialog;
